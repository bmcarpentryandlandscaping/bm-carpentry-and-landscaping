import { cache } from "react";
import type { z } from "zod";
import type { GalleryItem } from "./gallery.ts";
import {
  DISCIPLINES,
  HERO,
  MOSAIC,
  PROJECTS,
  SERVICES_HERO,
  WORKSHOP,
  type ProjectRecord,
} from "./defaults.ts";
import {
  Disciplines,
  Hero,
  Mosaic,
  type Mosaic as MosaicType,
  ProjectData,
  ServicesHero,
  Workshop,
} from "./schemas.ts";

/**
 * The only module that reads content out of Supabase.
 *
 * Reads go through plain `fetch` to PostgREST rather than supabase-js so that
 * Next's `next: { tags }` option applies — that is what lets a server action
 * purge a specific page with updateTag() after a save.
 *
 * Every export returns its default from defaults.ts on ANY failure: network
 * error, non-2xx, missing row, or data that does not parse. One console.error,
 * then the site renders. Supabase being down must never mean a blank site.
 */

const URL_BASE = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

async function rest<T>(path: string, tags: string[]): Promise<T[] | null> {
  if (!URL_BASE || !ANON) return null; // not configured — defaults are correct
  try {
    const res = await fetch(`${URL_BASE}/rest/v1/${path}`, {
      headers: { apikey: ANON, Authorization: `Bearer ${ANON}` },
      next: { tags },
    });
    if (!res.ok) {
      console.error(`[content] ${path} -> HTTP ${res.status}`);
      return null;
    }
    return (await res.json()) as T[];
  } catch (err) {
    console.error(`[content] ${path} ->`, err);
    return null;
  }
}

/** Read one singleton `content` row, parse it, or fall back. */
function singleton<S extends z.ZodTypeAny>(key: string, schema: S, fallback: z.infer<S>) {
  return cache(async (): Promise<z.infer<S>> => {
    const rows = await rest<{ data: unknown }>(
      `content?key=eq.${encodeURIComponent(key)}&select=data`,
      ["content"],
    );
    if (!rows || rows.length === 0) return fallback;
    const parsed = schema.safeParse(rows[0].data);
    if (!parsed.success) {
      console.error(`[content] ${key} failed to parse:`, parsed.error.issues);
      return fallback;
    }
    return parsed.data;
  });
}

export const getHero = singleton("home.hero", Hero, HERO);
export const getDisciplines = singleton("disciplines", Disciplines, DISCIPLINES);
export const getMosaic = singleton("home.mosaic", Mosaic, MOSAIC);
export const getWorkshop = singleton("home.workshop", Workshop, WORKSHOP);
export const getServicesHero = singleton("services.hero", ServicesHero, SERVICES_HERO);

/**
 * ProjectData -> GalleryItem, the shape every existing component and every
 * generator in gallery.ts already speaks. Optional fields stay absent when empty
 * so the generators keep supplying them.
 */
export function toGalleryItem(rec: ProjectRecord): GalleryItem {
  const d = rec.data;
  return {
    id: d.id,
    title: d.title,
    location: d.location,
    categories: [...d.categories],
    img: d.cover,
    size: d.size,
    slug: rec.slug,
    year: d.year,
    ...(d.pos ? { pos: d.pos } : {}),
    ...(d.summary ? { summary: d.summary } : {}),
    ...(d.feature ? { featureImg: d.feature } : {}),
    ...(d.gallery.length > 0 ? { images: d.gallery } : {}),
  };
}

type ProjectRow = { slug: string; position: number; published: boolean; data: unknown };

/** Published projects in display order. Falls back to the full default list. */
export const getProjects = cache(async (): Promise<GalleryItem[]> => {
  const rows = await rest<ProjectRow>(
    "projects?published=eq.true&select=slug,position,published,data&order=position.asc",
    ["projects"],
  );
  if (!rows) return PROJECTS.map(toGalleryItem);

  // One malformed row must not take the whole index down — drop it and log it.
  const out: GalleryItem[] = [];
  for (const row of rows) {
    const parsed = ProjectData.safeParse(row.data);
    if (!parsed.success) {
      console.error(`[content] project ${row.slug} failed to parse:`, parsed.error.issues);
      continue;
    }
    out.push(toGalleryItem({ ...row, data: parsed.data }));
  }
  return out;
});

/** One published project by slug, or null. */
export const getProject = cache(async (slug: string): Promise<GalleryItem | null> => {
  const rows = await rest<ProjectRow>(
    `projects?published=eq.true&slug=eq.${encodeURIComponent(slug)}&select=slug,position,published,data`,
    ["projects", `project:${slug}`],
  );
  if (!rows) {
    const fallback = PROJECTS.find((p) => p.slug === slug);
    return fallback ? toGalleryItem(fallback) : null;
  }
  if (rows.length === 0) return null;
  const parsed = ProjectData.safeParse(rows[0].data);
  if (!parsed.success) {
    console.error(`[content] project ${slug} failed to parse:`, parsed.error.issues);
    const fallback = PROJECTS.find((p) => p.slug === slug);
    return fallback ? toGalleryItem(fallback) : null;
  }
  return toGalleryItem({ ...rows[0], data: parsed.data });
});

export type MosaicTile = {
  img: string;
  pos?: string;
  title: string;
  location: string;
  href: string;
};

const titleFromSlug = (slug: string) =>
  slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

/**
 * Pair each mosaic tile with the project it points at.
 *
 * Always returns exactly one tile per input tile. The ten size slots in
 * WORK_SIZES tile a perfect rectangle with no gaps on both the 2-col and 4-col
 * grids; dropping a tile whose project has been unpublished would tear a hole in
 * that packing. So an unresolved tile keeps its photo, takes a title from its
 * slug, and links to the projects index rather than to a 404.
 */
export function resolveMosaic(tiles: MosaicType["tiles"], projects: GalleryItem[]): MosaicTile[] {
  const bySlug = new Map(projects.map((p) => [p.slug ?? "", p]));
  return tiles.map((tile) => {
    const project = bySlug.get(tile.slug);
    return {
      img: tile.img,
      ...(tile.pos ? { pos: tile.pos } : {}),
      title: project?.title ?? titleFromSlug(tile.slug),
      location: project?.location ?? "",
      href: project ? `/projects/${tile.slug}` : "/projects",
    };
  });
}
