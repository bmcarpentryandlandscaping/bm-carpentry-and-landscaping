"use server";

import { updateTag } from "next/cache";
import { requireSession } from "@/lib/auth";
import type { ActionResult } from "@/lib/actions";
import { findReferences, slugify } from "@/lib/media";
import { ProjectData } from "@/lib/schemas";

export type ProjectRow = {
  id: string;
  slug: string;
  position: number;
  published: boolean;
  data: ProjectData;
};

/** Purge the index, the sitemap and this project's own page. */
function purge(slug: string, previousSlug?: string) {
  updateTag("projects");
  updateTag(`project:${slug}`);
  if (previousSlug && previousSlug !== slug) updateTag(`project:${previousSlug}`);
}

export async function listProjects(): Promise<ActionResult<ProjectRow[]>> {
  try {
    const { supabase } = await requireSession();
    const { data, error } = await supabase
      .from("projects")
      .select("id,slug,position,published,data")
      .order("position", { ascending: true });
    if (error) return { ok: false, error: error.message };

    // A row that does not parse must stay LISTABLE, or it becomes invisible and
    // therefore unfixable from the admin. Keep its real title when it has one —
    // a freshly created project has a title but no cover yet, and replacing its
    // name with the slug would make the client think something is broken.
    const rows = (data ?? []).map((r) => ({
      ...r,
      data: ProjectData.safeParse(r.data).success
        ? (r.data as ProjectData)
        : ({
            ...(r.data as object),
            title: `${(r.data as { title?: string } | null)?.title || r.slug} (incomplete)`,
          } as ProjectData),
    }));
    return { ok: true, data: rows as ProjectRow[] };
  } catch {
    return { ok: false, error: "Not signed in." };
  }
}

export async function getProjectRow(id: string): Promise<ActionResult<ProjectRow>> {
  try {
    const { supabase } = await requireSession();
    const { data, error } = await supabase
      .from("projects")
      .select("id,slug,position,published,data")
      .eq("id", id)
      .single();
    if (error || !data) return { ok: false, error: "That project no longer exists." };
    return { ok: true, data: data as ProjectRow };
  } catch {
    return { ok: false, error: "Not signed in." };
  }
}

/** A new project starts unpublished, so a half-filled one never reaches the site. */
export async function createProject(title: string): Promise<ActionResult<{ id: string }>> {
  try {
    const { supabase } = await requireSession();
    const clean = title.trim().slice(0, 48);
    if (!clean) return { ok: false, error: "Give the project a name." };

    const slug = await uniqueSlug(supabase, slugify(clean));

    const { data: last } = await supabase
      .from("projects")
      .select("position")
      .order("position", { ascending: false })
      .limit(1)
      .maybeSingle();

    const data: ProjectData = {
      id: slug,
      title: clean,
      location: "Sydney",
      year: new Date().getFullYear(),
      categories: ["Gardens"],
      size: "sm",
      cover: "",
      gallery: [],
    };

    const { data: row, error } = await supabase
      .from("projects")
      .insert({ slug, position: (last?.position ?? -1) + 1, published: false, data })
      .select("id")
      .single();
    if (error || !row) return { ok: false, error: error?.message ?? "Could not create the project." };

    purge(slug);
    return { ok: true, data: { id: row.id as string } };
  } catch {
    return { ok: false, error: "Not signed in." };
  }
}

export async function updateProject(
  id: string,
  input: { slug: string; data: unknown },
): Promise<ActionResult<{ slug: string }>> {
  try {
    const { supabase } = await requireSession();

    // Check the cover BEFORE Zod. `createProject` writes `cover: ""` so a new
    // project exists before it has a photo, but `ProjectData.cover` is
    // `.min(1)` — so a plain safeParse would reject first and show the client a
    // raw schema message ("cover: String must contain at least 1 character(s)")
    // instead of the sentence written for them.
    const draft = input.data as Partial<ProjectData> | null;
    if (!draft?.cover) return { ok: false, error: "Choose a cover photo." };

    const parsed = ProjectData.safeParse(input.data);
    if (!parsed.success) {
      const first = parsed.error.issues[0];
      return { ok: false, error: `${first.path.join(".") || "value"}: ${first.message}` };
    }

    const current = await getProjectRow(id);
    if (!current.ok) return current;

    let slug = slugify(input.slug);
    if (slug !== current.data.slug) slug = await uniqueSlug(supabase, slug, id);

    const { error } = await supabase
      .from("projects")
      .update({ slug, data: parsed.data, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (error) return { ok: false, error: error.message };

    // A rename must not orphan a homepage tile.
    //
    // setPublished and deleteProject REFUSE when a mosaic tile points at the
    // project. Refusing here too would make a featured project unrenameable —
    // and that is the common case, since ten tiles point at four projects. So
    // follow the rename instead of blocking it. Without this the tile keeps its
    // photo but silently loses its caption and links to /projects, which is the
    // exact outcome those two guards exist to prevent.
    if (slug !== current.data.slug) await repointMosaic(supabase, current.data.slug, slug);

    purge(slug, current.data.slug);
    return { ok: true, data: { slug } };
  } catch {
    return { ok: false, error: "Not signed in." };
  }
}

/**
 * Unpublishing hides the project from the index, the sitemap and its own URL.
 * Refused while a homepage mosaic tile points at it — that tile would lose its
 * caption and its link.
 */
export async function setPublished(id: string, published: boolean): Promise<ActionResult> {
  try {
    const { supabase } = await requireSession();
    const current = await getProjectRow(id);
    if (!current.ok) return current;

    if (!published) {
      const { data: mosaicRow, error: mosaicErr } = await supabase
        .from("content")
        .select("data")
        .eq("key", "home.mosaic")
        .maybeSingle();
      // Fail closed: if we can't read the mosaic, we can't rule out that a
      // tile points here, and unpublishing would orphan it.
      if (mosaicErr) {
        return { ok: false, error: "Could not check the homepage mosaic. Try again." };
      }
      const tiles = (mosaicRow?.data as { tiles?: { slug: string }[] } | null)?.tiles ?? [];
      const used = tiles
        .map((t, i) => (t.slug === current.data.slug ? i + 1 : 0))
        .filter(Boolean);
      if (used.length) {
        return {
          ok: false,
          error: `Featured tile${used.length > 1 ? "s" : ""} ${used.join(", ")} on the homepage ${used.length > 1 ? "link" : "links"} to this project. Point ${used.length > 1 ? "them" : "it"} somewhere else first.`,
        };
      }
    }

    const { error } = await supabase.from("projects").update({ published }).eq("id", id);
    if (error) return { ok: false, error: error.message };

    purge(current.data.slug);
    return { ok: true, data: undefined };
  } catch {
    return { ok: false, error: "Not signed in." };
  }
}

/**
 * Swap this project's position with its neighbour.
 *
 * ponytail: read-then-write, not atomic. Two overlapping reorders from two tabs
 * can both compute from the same stale snapshot; the later write wins and can
 * leave two rows sharing a position, which nothing re-normalises. Ordering then
 * ties non-deterministically. Acceptable for a single-admin panel; the upgrade,
 * if a second editor ever exists, is to rewrite every row's position from the
 * reordered array in one pass rather than swapping a pair.
 */
export async function moveProject(id: string, direction: "up" | "down"): Promise<ActionResult> {
  try {
    const { supabase } = await requireSession();
    const all = await listProjects();
    if (!all.ok) return all;

    const i = all.data.findIndex((p) => p.id === id);
    const j = direction === "up" ? i - 1 : i + 1;
    if (i === -1 || j < 0 || j >= all.data.length) return { ok: true, data: undefined };

    const a = all.data[i];
    const b = all.data[j];

    // Two updates, not an upsert. PostgREST's upsert is INSERT ... ON CONFLICT,
    // so a partial row would fail the NOT NULL constraints on slug and data.
    // `position` has no unique constraint, so the transient duplicate is fine.
    const [{ error: errA }, { error: errB }] = await Promise.all([
      supabase.from("projects").update({ position: b.position }).eq("id", a.id),
      supabase.from("projects").update({ position: a.position }).eq("id", b.id),
    ]);
    const error = errA ?? errB;
    if (error) return { ok: false, error: error.message };

    updateTag("projects");
    return { ok: true, data: undefined };
  } catch {
    return { ok: false, error: "Not signed in." };
  }
}

/** Refused while a mosaic tile still points at it. */
export async function deleteProject(id: string): Promise<ActionResult> {
  try {
    const { supabase } = await requireSession();
    const current = await getProjectRow(id);
    if (!current.ok) return current;

    const { data: mosaicRow, error: mosaicErr } = await supabase
      .from("content")
      .select("data")
      .eq("key", "home.mosaic")
      .maybeSingle();
    // Fail closed: if we can't read the mosaic, we can't rule out that a
    // tile points here, and deleting would orphan it.
    if (mosaicErr) {
      return { ok: false, error: "Could not check the homepage mosaic. Try again." };
    }
    const tiles = (mosaicRow?.data as { tiles?: { slug: string }[] } | null)?.tiles ?? [];
    const used = tiles.map((t, i) => (t.slug === current.data.slug ? i + 1 : 0)).filter(Boolean);
    if (used.length) {
      return {
        ok: false,
        error: `Featured tile${used.length > 1 ? "s" : ""} ${used.join(", ")} on the homepage ${used.length > 1 ? "link" : "links"} to this project. Point ${used.length > 1 ? "them" : "it"} somewhere else first.`,
      };
    }

    const { error } = await supabase.from("projects").delete().eq("id", id);
    if (error) return { ok: false, error: error.message };

    purge(current.data.slug);
    return { ok: true, data: undefined };
  } catch {
    return { ok: false, error: "Not signed in." };
  }
}

/**
 * Rewrites any homepage mosaic tile that pointed at `fromSlug` to `toSlug`.
 *
 * Best-effort: a failure here is logged, not surfaced. The project rename itself
 * has already succeeded, and failing the whole action afterwards would leave the
 * client staring at an error for a save that actually worked.
 */
async function repointMosaic(
  supabase: Awaited<ReturnType<typeof requireSession>>["supabase"],
  fromSlug: string,
  toSlug: string,
): Promise<void> {
  const { data: row, error: readErr } = await supabase
    .from("content")
    .select("data")
    .eq("key", "home.mosaic")
    .maybeSingle();

  if (readErr) {
    // Called after the rename already succeeded — must not fail the action.
    // But a swallowed read error here is exactly the "orphaned tile" bug Fix 3
    // exists to prevent, just reached from the rename path instead of
    // publish/delete, so log it the same way the update failure below is logged.
    console.error("[projects] could not read mosaic to repoint after rename:", readErr.message);
    return;
  }

  const stored = row?.data as { tiles?: { slug: string }[] } | null;
  const tiles = stored?.tiles;
  if (!Array.isArray(tiles) || !tiles.some((t) => t?.slug === fromSlug)) return;

  const next = {
    ...stored,
    tiles: tiles.map((t) => (t?.slug === fromSlug ? { ...t, slug: toSlug } : t)),
  };

  const { error } = await supabase
    .from("content")
    .update({ data: next, updated_at: new Date().toISOString() })
    .eq("key", "home.mosaic");

  if (error) {
    console.error("[projects] could not repoint mosaic tiles after rename:", error.message);
    return;
  }
  updateTag("content");
}

/** Appends -2, -3 … until the slug is free. */
async function uniqueSlug(
  supabase: Awaited<ReturnType<typeof requireSession>>["supabase"],
  base: string,
  ignoreId?: string,
): Promise<string> {
  for (let n = 1; n < 50; n++) {
    const candidate = n === 1 ? base : `${base}-${n}`;
    let q = supabase.from("projects").select("id").eq("slug", candidate);
    if (ignoreId) q = q.neq("id", ignoreId);
    const { data } = await q.maybeSingle();
    if (!data) return candidate;
  }
  return `${base}-${Date.now()}`;
}
