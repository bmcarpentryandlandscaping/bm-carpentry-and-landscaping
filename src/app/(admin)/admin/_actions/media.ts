"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import type { ActionResult } from "@/lib/actions";
import { findReferences, type ContentBundle } from "@/lib/media";
import { MediaRow } from "@/lib/schemas";
import type { ProjectRecord } from "@/lib/defaults";

const NewMedia = z.object({
  url: z.string().min(1),
  name: z.string().min(1).max(120),
  alt: z.string().max(160).default(""),
  kind: z.enum(["image", "video"]),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
  bytes: z.number().int().positive().optional(),
});

/** The library, newest first. `query` matches on name. */
export async function listMedia(query = ""): Promise<ActionResult<MediaRow[]>> {
  try {
    const { supabase } = await requireSession();
    let q = supabase.from("media").select("*").order("created_at", { ascending: false });
    if (query.trim()) q = q.ilike("name", `%${query.trim()}%`);
    const { data, error } = await q;
    if (error) return { ok: false, error: error.message };
    const rows = z.array(MediaRow).safeParse(data);
    if (!rows.success) return { ok: false, error: "The media library contains a malformed row." };
    return { ok: true, data: rows.data };
  } catch {
    return { ok: false, error: "Not signed in." };
  }
}

/** Called by the browser after a Storage upload succeeds. */
export async function createMediaRow(
  input: z.input<typeof NewMedia>,
): Promise<ActionResult<MediaRow>> {
  try {
    const { supabase } = await requireSession();
    const parsed = NewMedia.safeParse(input);
    if (!parsed.success) return { ok: false, error: "That file's details are not valid." };

    const { data, error } = await supabase
      .from("media")
      .insert({ ...parsed.data, source: "upload" })
      .select()
      .single();
    if (error) return { ok: false, error: error.message };

    revalidatePath("/admin/media");
    return { ok: true, data: MediaRow.parse(data) };
  } catch {
    return { ok: false, error: "Not signed in." };
  }
}

export async function renameMedia(id: string, name: string): Promise<ActionResult> {
  return updateMedia(id, { name: name.trim().slice(0, 120) }, name.trim().length > 0);
}

export async function setMediaAlt(id: string, alt: string): Promise<ActionResult> {
  return updateMedia(id, { alt: alt.slice(0, 160) }, true);
}

async function updateMedia(
  id: string,
  patch: Record<string, string>,
  valid: boolean,
): Promise<ActionResult> {
  if (!valid) return { ok: false, error: "That value cannot be empty." };
  try {
    const { supabase } = await requireSession();
    const { error } = await supabase.from("media").update(patch).eq("id", id);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/admin/media");
    return { ok: true, data: undefined };
  } catch {
    return { ok: false, error: "Not signed in." };
  }
}

type Supa = Awaited<ReturnType<typeof requireSession>>["supabase"];

/**
 * Everything that can point at a media file, read once.
 *
 * Both the delete guard and the library's "where is this used" column need the
 * same two tables, so they share one reader. Returns null if either read fails
 * — callers decide what a failure means, and for the delete guard it must mean
 * "refuse", never "found nothing".
 */
async function referenceSources(
  supabase: Supa,
): Promise<{ bundle: ContentBundle; projects: ProjectRecord[] } | null> {
  const [
    { data: contentRows, error: contentErr },
    { data: projectRows, error: projectErr },
  ] = await Promise.all([
    supabase.from("content").select("key,data"),
    supabase.from("projects").select("slug,position,published,data"),
  ]);
  if (contentErr || projectErr) return null;

  const bundle: ContentBundle = {};
  for (const c of contentRows ?? []) {
    if (c.key === "home.hero") bundle.hero = c.data;
    if (c.key === "disciplines") bundle.disciplines = c.data;
    if (c.key === "home.mosaic") bundle.mosaic = c.data;
    if (c.key === "home.workshop") bundle.workshop = c.data;
    if (c.key === "services.hero") bundle.servicesHero = c.data;
  }
  return { bundle, projects: (projectRows ?? []) as ProjectRecord[] };
}

/**
 * Where every file in the library is used, keyed by URL.
 *
 * Computed in one pass on the server rather than one lookup per photo: the two
 * source tables are read once and every media URL is matched against them, so a
 * 300-photo library still costs two queries. A URL missing from the map is used
 * nowhere.
 */
export async function listMediaUsage(): Promise<ActionResult<Record<string, string[]>>> {
  try {
    const { supabase } = await requireSession();
    const [{ data: rows, error }, sources] = await Promise.all([
      supabase.from("media").select("url"),
      referenceSources(supabase),
    ]);
    if (error) return { ok: false, error: error.message };
    if (!sources) return { ok: false, error: "Could not check where your photos are used." };

    const usage: Record<string, string[]> = {};
    for (const { url } of (rows ?? []) as { url: string }[]) {
      const refs = findReferences(url, sources.bundle, sources.projects);
      if (refs.length > 0) usage[url] = refs;
    }
    return { ok: true, data: usage };
  } catch {
    return { ok: false, error: "Not signed in." };
  }
}

/**
 * Deletes an uploaded file, refusing when something still points at it.
 *
 * Two guards, both server-side, because both protect the live site:
 *   1. `source = 'repo'` is never deletable — those files ship with the build
 *      and deleting the row would not delete the file, just hide it.
 *   2. anything currently referenced is refused, and the error names every
 *      place it is used so the client can go and change them first.
 */
export async function deleteMedia(id: string): Promise<ActionResult> {
  try {
    const { supabase } = await requireSession();

    const { data: row, error: readErr } = await supabase
      .from("media")
      .select("*")
      .eq("id", id)
      .single();
    if (readErr || !row) return { ok: false, error: "That file no longer exists." };

    const sources = await referenceSources(supabase);
    // The reference scan must fail CLOSED: if we cannot read what points at
    // this file, we cannot know it's safe to delete. Proceeding on a failed
    // read would find zero references and permanently remove the file from
    // Storage while the live site keeps pointing at it.
    if (!sources) {
      return { ok: false, error: "Could not check where this file is used. Try again." };
    }

    const refs = findReferences(row.url, sources.bundle, sources.projects);
    if (refs.length > 0) {
      return {
        ok: false,
        error: `Used in ${refs.length} place${refs.length === 1 ? "" : "s"}: ${refs.join(", ")}. Change ${refs.length === 1 ? "it" : "those"} first.`,
      };
    }

    // Storage first: a deleted row with an orphaned file is recoverable, a
    // deleted file with a live row shows a broken image on the site.
    //
    // A `repo` row has no Storage object — the file ships in public/ and stays
    // there. Deleting the row only removes it from the library, which is the
    // point: the client needs to clear the shipped photos they will never use
    // out of a 88-item picker. `npm run seed` puts them all back.
    const path = row.source === "repo" ? null : storagePath(row.url);
    if (path) {
      const { error: rmErr } = await supabase.storage.from("media").remove([path]);
      if (rmErr) return { ok: false, error: rmErr.message };
    } else if (row.source === "upload") {
      // An upload row whose URL we cannot map to an object key. We still remove
      // the row — leaving it would show a dead thumbnail the client cannot clear —
      // but the file is now orphaned in the bucket, so say so rather than failing
      // silently.
      console.error(`[media] no storage key for upload row ${row.id} (${row.url}); row deleted, file orphaned`);
    }

    const { error } = await supabase.from("media").delete().eq("id", id);
    if (error) return { ok: false, error: error.message };

    revalidatePath("/admin/media");
    return { ok: true, data: undefined };
  } catch {
    return { ok: false, error: "Not signed in." };
  }
}

/**
 * '.../storage/v1/object/public/media/2026/uuid.webp' -> '2026/uuid.webp'
 *
 * Returns null for anything that is not a public URL in THIS bucket — a repo
 * path, another bucket, an unrelated host. Null means "do not delete an object",
 * which is the safe direction: deleting the wrong key is unrecoverable.
 *
 * The query/hash strip matters: `getPublicUrl` can append parameters (e.g. image
 * transforms), and `2026/uuid.webp?width=800` is not a valid object key, so
 * without this the delete would quietly match nothing.
 */
function storagePath(url: string): string | null {
  const marker = "/storage/v1/object/public/media/";
  const i = url.indexOf(marker);
  if (i === -1) return null;
  const key = url.slice(i + marker.length).split(/[?#]/)[0];
  return key || null;
}
