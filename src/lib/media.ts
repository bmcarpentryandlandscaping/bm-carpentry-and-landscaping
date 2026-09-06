import type { ProjectRecord } from "./defaults.ts";
import type { Disciplines, Hero, Mosaic, ServicesHero, Workshop } from "./schemas.ts";

/** Longest edge an uploaded image is resized to, in CSS pixels. */
export const MAX_EDGE = 2400;

/** WebP quality for the browser-side re-encode. */
export const WEBP_QUALITY = 0.82;

export type ContentBundle = {
  hero?: Hero;
  disciplines?: Disciplines;
  mosaic?: Mosaic;
  workshop?: Workshop;
  servicesHero?: ServicesHero;
};

/**
 * Every place a media URL is used, as text a non-technical person can act on.
 *
 * This is what stands between the client and deleting the photo their homepage
 * is built on. The delete dialog shows these strings verbatim — "Used in 3
 * places: Home hero, Workshop 02 — Clad, Earlwood — gallery 2" — so they say
 * where to go and change it, not just that something broke.
 */
export function findReferences(
  url: string,
  content: ContentBundle,
  projects: ProjectRecord[],
): string[] {
  const refs: string[] = [];

  if (content.hero) {
    if (content.hero.src === url) refs.push("Home hero");
    if (content.hero.poster === url) refs.push("Home hero poster");
  }

  content.disciplines?.items.forEach((item) => {
    if (item.img === url) refs.push(`What we do — ${item.label}`);
  });

  content.mosaic?.tiles.forEach((tile, i) => {
    if (tile.img === url) refs.push(`Featured tile ${String(i + 1).padStart(2, "0")}`);
  });

  content.workshop?.stages.forEach((stage, i) => {
    if (stage.img === url) {
      refs.push(`Workshop ${String(i + 1).padStart(2, "0")} — ${stage.name}`);
    }
  });

  if (content.servicesHero) {
    if (content.servicesHero.a.src === url) refs.push("Services hero A");
    if (content.servicesHero.b.src === url) refs.push("Services hero B");
  }

  for (const p of projects) {
    // These rows come straight out of the database in the delete guard, so they
    // may not have been schema-parsed. A malformed row must not throw here —
    // that would turn "cannot check references" into "delete succeeded".
    const d = p?.data;
    if (!d) continue;
    const title = d.title ?? p.slug;
    if (d.cover === url) refs.push(`${title} — cover`);
    if (d.feature === url) refs.push(`${title} — feature image`);
    (Array.isArray(d.gallery) ? d.gallery : []).forEach((g, i) => {
      if (g === url) refs.push(`${title} — gallery ${i + 1}`);
    });
  }

  return refs;
}

/**
 * URL slug from a title. Deliberately identical to the private `kebab` in
 * gallery.ts — seeded projects took their slugs from that, and admin-created
 * ones must be indistinguishable.
 */
export function slugify(text: string): string {
  const out = text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  return out || "project";
}

/**
 * Dimensions that fit inside a `max`-pixel square, preserving aspect ratio.
 * Never returns zero: a canvas of width 0 throws on toBlob.
 */
export function fitWithin(width: number, height: number, max: number) {
  const longest = Math.max(width, height);
  if (longest <= max) return { width, height };
  const scale = max / longest;
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}
