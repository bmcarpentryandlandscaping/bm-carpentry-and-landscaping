import { z } from "zod";
import { CATEGORIES } from "./gallery.ts";

/**
 * The single source of truth for admin forms and site readers.
 *
 * The max lengths are load-bearing, not decoration: the typography on the site
 * is size-tuned per string, and a label two words longer than expected wraps
 * into a layout that was never designed for two lines. Do not relax them
 * without looking at the surface that renders the field.
 */

/**
 * `alt` is REQUIRED here, deliberately — no `.default("")`.
 *
 * A `.default()` splits Zod's input and output types (`alt` optional going in,
 * present coming out). `useForm<ServicesHero>` is typed on the OUTPUT type while
 * `zodResolver` validates the INPUT type, so the mismatch is a hard tsc error in
 * ServicesHeroEditor. Dropping the default resolves it.
 *
 * Note this genuinely changes the contract: `{ src }` with no `alt` no longer
 * parses. That is acceptable because every writer supplies one — `defaults.ts`
 * has alt text on both services images, and `ImageSlot` always sets it — and an
 * empty string is still valid, since there is no `.min()`.
 */
export const MediaRef = z.object({
  src: z.string().min(1),
  alt: z.string().max(160),
});

/** Homepage hero — an image, or an mp4 with a first-frame poster. */
export const Hero = z.object({
  kind: z.enum(["image", "video"]),
  src: z.string().min(1),
  poster: z.string().optional(), // video only
  alt: z.string().max(160),
});
export type Hero = z.infer<typeof Hero>;

/**
 * The four practices. Renders in two places from this one key — WhatWeDo on the
 * homepage and the discipline cards on /services — which today hold byte-identical
 * copy in two different shapes. One edit updates both.
 */
export const Disciplines = z.object({
  items: z
    .array(
      z.object({
        label: z.string().min(1).max(24), // "Garden Maintenance" = 18
        blurb: z.string().min(1).max(260),
        img: z.string().min(1),
        alt: z.string().max(160),
      }),
    )
    .length(4),
});
export type Disciplines = z.infer<typeof Disciplines>;

/** Homepage featured mosaic. Sizes are NOT here — WORK_SIZES stays in the page. */
export const Mosaic = z.object({
  tiles: z
    .array(
      z.object({
        slug: z.string().min(1), // must resolve to a published project
        img: z.string().min(1),
        pos: z.string().max(24).optional(), // object-position, e.g. "center 60%"
      }),
    )
    .length(10),
});
export type Mosaic = z.infer<typeof Mosaic>;

/** Workshop stages. The "01".."05" index is derived from array order, not stored. */
export const Workshop = z.object({
  stages: z
    .array(
      z.object({
        name: z.string().min(1).max(12), // "Frame"
        cap: z.string().min(1).max(90),
        img: z.string().min(1),
        alt: z.string().max(160),
      }),
    )
    .length(5),
});
export type Workshop = z.infer<typeof Workshop>;

/** The two /services hero images and their caption pills. */
export const ServicesHero = z.object({
  a: MediaRef.extend({ caption: z.string().max(18) }), // "Earlwood"
  b: MediaRef.extend({ caption: z.string().max(18) }), // "Sydney"
});
export type ServicesHero = z.infer<typeof ServicesHero>;

/**
 * A project. summary / feature / gallery stay optional on purpose: when they are
 * absent the existing generators in gallery.ts (projectDescription, projectFeature,
 * projectImages) supply the value, exactly as they do today. That is why seeding
 * cannot regress the site.
 */
export const ProjectData = z.object({
  id: z.string().min(1), // stable; seeds keep g01..g17 so generated copy is unchanged
  title: z.string().min(1).max(48),
  location: z.string().min(1).max(48),
  year: z.number().int().min(2000).max(2100),
  categories: z.array(z.enum(CATEGORIES)).min(1),
  size: z.enum(["sm", "wide", "tall", "lg"]),
  pos: z.string().max(24).optional(),
  summary: z.string().max(400).optional(),
  cover: z.string().min(1),
  feature: z.string().optional(),
  gallery: z.array(z.string()).max(24),
});
export type ProjectData = z.infer<typeof ProjectData>;

/** A row of the media library. */
export const MediaRow = z.object({
  id: z.string(),
  url: z.string().min(1),
  name: z.string().min(1).max(120),
  alt: z.string().max(160),
  source: z.enum(["repo", "upload"]),
  kind: z.enum(["image", "video"]),
  width: z.number().int().nullable().optional(),
  height: z.number().int().nullable().optional(),
  bytes: z.number().int().nullable().optional(),
});
export type MediaRow = z.infer<typeof MediaRow>;

/**
 * Key -> schema for the `content` table's five singleton rows. The seed script,
 * the read layer and the admin save action all drive off this map, so adding a
 * section means adding one entry here and nothing else structural.
 */
export const CONTENT_SCHEMAS = {
  "home.hero": Hero,
  disciplines: Disciplines,
  "home.mosaic": Mosaic,
  "home.workshop": Workshop,
  "services.hero": ServicesHero,
} as const;

export type ContentKey = keyof typeof CONTENT_SCHEMAS;
