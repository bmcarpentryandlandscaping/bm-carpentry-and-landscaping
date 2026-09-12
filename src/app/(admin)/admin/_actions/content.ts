"use server";

import { updateTag } from "next/cache";
import { requireSession } from "@/lib/auth";
import type { ActionResult } from "@/lib/actions";
import { CONTENT_SCHEMAS, type ContentKey } from "@/lib/schemas";
import {
  DISCIPLINES,
  HERO,
  MOSAIC,
  SERVICES_COPY,
  SERVICES_HERO,
  SITE_DETAILS,
  WORKSHOP,
} from "@/lib/defaults";

const FALLBACK: Record<ContentKey, unknown> = {
  "home.hero": HERO,
  disciplines: DISCIPLINES,
  "home.mosaic": MOSAIC,
  "home.workshop": WORKSHOP,
  "services.hero": SERVICES_HERO,
  "services.copy": SERVICES_COPY,
  "site.details": SITE_DETAILS,
};

/**
 * The admin's read path — deliberately not content.ts.
 *
 * content.ts is tag-cached for the public site; the editor must always show what
 * is actually stored right now, or a save would silently overwrite a change made
 * from another browser.
 *
 * On a read error we THROW — the admin error boundary (error.tsx) shows a
 * recovery screen with "Try again" / "Sign in again". We must never treat "the
 * read failed" as "the row is absent": that would render FALLBACK as though it
 * were the stored content, and the client's next Save would write those
 * defaults over their live content.
 *
 * FALLBACK is returned only for the genuine first-run case: the read succeeded
 * and the row is absent, or its data does not parse against the current schema.
 */
export async function loadContent<K extends ContentKey>(key: K) {
  const { supabase } = await requireSession();
  const { data, error } = await supabase.from("content").select("data").eq("key", key).maybeSingle();
  if (error) throw error;

  const parsed = CONTENT_SCHEMAS[key].safeParse(data?.data);
  return (parsed.success ? parsed.data : FALLBACK[key]) as ReturnType<
    (typeof CONTENT_SCHEMAS)[K]["parse"]
  >;
}

/**
 * Validates against the same schema the form used, then writes and purges.
 *
 * Re-validating here is not redundant: the form runs in the browser and a server
 * action is a public endpoint, so client-side validation is a convenience for the
 * client and nothing more.
 */
export async function saveContent(key: ContentKey, data: unknown): Promise<ActionResult> {
  try {
    const { supabase } = await requireSession();

    const schema = CONTENT_SCHEMAS[key];
    if (!schema) return { ok: false, error: "Unknown section." };

    const parsed = schema.safeParse(data);
    if (!parsed.success) {
      const first = parsed.error.issues[0];
      return { ok: false, error: `${first.path.join(".") || "value"}: ${first.message}` };
    }

    const { error } = await supabase
      .from("content")
      .upsert({ key, data: parsed.data, updated_at: new Date().toISOString() }, { onConflict: "key" });
    if (error) return { ok: false, error: error.message };

    // Next 16's `revalidateTag` now requires a cacheLife profile as a second
    // argument (it targets Cache Components' "use cache" entries). `updateTag`
    // takes just the tag and is what Next's own docs point to for a Server
    // Action wanting the tag gone before it returns — exactly this case.
    updateTag("content");
    return { ok: true, data: undefined };
  } catch {
    return { ok: false, error: "Not signed in." };
  }
}

/** Slug + title of every published project, for the mosaic's project picker. */
export async function listPublishedProjects(): Promise<{ slug: string; title: string }[]> {
  const { supabase } = await requireSession();
  const { data } = await supabase
    .from("projects")
    .select("slug,data")
    .eq("published", true)
    .order("position", { ascending: true });
  return (data ?? []).map((r) => ({
    slug: r.slug as string,
    title: ((r.data as { title?: string })?.title ?? r.slug) as string,
  }));
}
