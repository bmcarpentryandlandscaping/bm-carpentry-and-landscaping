export type GallerySize = "sm" | "wide" | "tall" | "lg";

export type GalleryItem = {
  id: string;
  title: string;
  location: string;
  /** Categories this item is filed under (drives the filter bar). */
  categories: string[];
  img: string;
  size: GallerySize;
  /** object-position for the crop; lets a reused photo read differently. */
  pos?: string;
  /** Explicit slug; falls back to a kebab-cased title when omitted. */
  slug?: string;
  /** Optional hand-written intro line; otherwise one is generated. */
  summary?: string;
  /** Optional explicit completion year; otherwise derived. */
  year?: number;
  /** Optional project-specific custom gallery images/videos. */
  images?: string[];
  /** Optional custom feature image for the editorial spread. */
  featureImg?: string;
};

/** Filter chips, in display order. "All" is prepended in the UI. */
export const CATEGORIES = ["Pools", "Gardens", "Carpentry", "Courtyards", "Coastal"] as const;

export const galleryItems: GalleryItem[] = [
  {
    id: "g01",
    title: "Kiama Boardwalk",
    location: "Kiama, South Coast",
    categories: ["Carpentry", "Coastal"],
    img: "/images/earlwood-3.webp",
    size: "lg",
  },
  {
    id: "g02",
    title: "Campsie Deck & Garden",
    location: "Campsie, Sydney",
    categories: ["Carpentry", "Gardens"],
    img: "/images/campsie-2.webp",
    size: "sm",
    slug: "campsie",
    year: 2026,
    summary:
      "An integrated timber deck and stair installation featuring custom-engineered drainage systems and structural planter boxes built to border the outdoor area.",
  },
  {
    id: "g03",
    title: "Bronte Courtyard",
    location: "Bronte, Sydney",
    categories: ["Courtyards", "Gardens"],
    img: "/images/campsie-4.webp",
    size: "wide",
  },
  {
    id: "g04",
    title: "Mosman Deck Details",
    location: "Mosman, Sydney",
    categories: ["Carpentry"],
    img: "/images/earlwood-1.webp",
    size: "tall",
  },
  {
    id: "g05",
    title: "Balmoral Poolside",
    location: "Balmoral, Sydney",
    categories: ["Pools", "Coastal"],
    img: "/images/campsie-3.webp",
    size: "wide",
  },
  {
    id: "g06",
    title: "Palm Beach Pergola",
    location: "Palm Beach, Sydney",
    categories: ["Carpentry", "Coastal"],
    img: "/images/studio-1.webp",
    size: "sm",
  },
  {
    id: "g07",
    title: "Vaucluse Garden Walkway",
    location: "Vaucluse, Sydney",
    categories: ["Gardens"],
    img: "/images/avalon-3.webp",
    size: "sm",
    pos: "center 40%",
  },
  {
    id: "g08",
    title: "Avalon Beach Stairs",
    location: "Avalon Beach, Sydney",
    categories: ["Gardens", "Coastal"],
    img: "/images/avalon-1.webp",
    size: "sm",
    slug: "avalon-beach",
    year: 2026,
    summary:
      "Bespoke carpentry and garden engineering featuring closed stringer stairs, curved steps, structural retaining walls, and raised timber garden beds.",
  },
  {
    id: "g09",
    title: "Clovelly Terraces",
    location: "Clovelly, Sydney",
    categories: ["Courtyards"],
    img: "/images/avalon-4.webp",
    size: "sm",
    pos: "center 70%",
  },
  {
    id: "g10",
    title: "Coogee Garden Steps",
    location: "Coogee, Sydney",
    categories: ["Gardens", "Coastal"],
    img: "/images/avalon-2.webp",
    size: "wide",
    pos: "center 60%",
  },
  {
    id: "g11",
    title: "Berry Meadow Planters",
    location: "Berry, South Coast",
    categories: ["Gardens"],
    img: "/images/avalon-5.webp",
    size: "sm",
  },
  {
    id: "g12",
    title: "Cremorne Timber Wall",
    location: "Cremorne, Sydney",
    categories: ["Carpentry"],
    img: "/images/studio-2.webp",
    size: "sm",
    pos: "center 30%",
  },
  {
    id: "g13",
    title: "Avalon Screen",
    location: "Avalon Beach, Sydney",
    categories: ["Carpentry", "Gardens"],
    img: "/images/avalon-6.webp",
    size: "lg",
    pos: "center 55%",
  },
  {
    id: "g14",
    title: "Jervis Bay Decking",
    location: "Jervis Bay, South Coast",
    categories: ["Gardens", "Coastal"],
    img: "/images/earlwood-2.webp",
    size: "tall",
  },
  {
    id: "g15",
    title: "Northbridge Courtyard",
    location: "Northbridge, Sydney",
    categories: ["Courtyards"],
    img: "/images/campsie-1.webp",
    size: "sm",
  },
  {
    id: "g16",
    title: "Earlwood Deck & Garden",
    location: "Earlwood, Sydney",
    categories: ["Carpentry", "Gardens"],
    img: "/images/earlwood-home-cover.webp",
    size: "lg",
    slug: "earlwood",
    year: 2026,
    summary:
      "A full carpentry-led rebuild across three terraced levels: structural framing, vertical timber cladding, hand-laid hardwood decking and zoned garden planting, built and planted by one crew from first dig to final coat.",
  },
  {
    id: "g17",
    title: "Paddington Courtyard",
    location: "Paddington, Sydney",
    categories: ["Courtyards", "Carpentry"],
    // ponytail: placeholder photo — swap for real Paddington site photography once supplied
    img: "/images/from-live-site/live-site-4-hero.webp",
    size: "wide",
    slug: "paddington",
  },
];

/* ── Per-project detail page helpers ────────────────────────────────────── */

const kebab = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

const num = (item: GalleryItem) => parseInt(item.id.replace(/\D/g, ""), 10) || 1;

export const projectSlug = (item: GalleryItem) => item.slug ?? kebab(item.title);

export const projectYear = (item: GalleryItem) => item.year ?? 2018 + (num(item) % 8);

export function getProject(slug: string): GalleryItem | undefined {
  return galleryItems.find((g) => projectSlug(g) === slug);
}

/** The next `n` projects after `slug`, wrapping around the list. */
export function getMoreProjects(items: GalleryItem[], slug: string, n = 3): GalleryItem[] {
  const start = items.findIndex((g) => projectSlug(g) === slug);
  const out: GalleryItem[] = [];
  for (let k = 1; out.length < n && k <= items.length; k++) {
    const item = items[(start + k) % items.length];
    if (item) out.push(item);
  }
  return out;
}

const SCOPE: Record<string, string[]> = {
  Pools: ["Pool design", "Construction", "Timber & stone surrounds"],
  Gardens: ["Landscape design", "Construction", "Planting"],
  Carpentry: ["Joinery & carpentry", "Steel fabrication", "Construction"],
  Courtyards: ["Design", "Paving & stonework", "Planting"],
  Coastal: ["Design", "Construction", "Planting"],
};

export const projectScope = (item: GalleryItem) =>
  SCOPE[item.categories[0] ?? "Gardens"] ?? ["Design", "Construction"];

const CONTEXT = [
  (loc: string) =>
    `In ${loc}, the work began with the ground itself: its fall, its light, and the way the weather moves across it.`,
  (loc: string) =>
    `${loc} gave us a site with real character, and a client who wanted it handled with a light touch.`,
  (loc: string) =>
    `The project sits in ${loc}, where established trees and the outlook did much of the early design work for us.`,
  (loc: string) =>
    `Set in ${loc}, the brief asked for something that would feel settled and at home from the first season.`,
];

const APPROACH: Record<string, string[]> = {
  Pools: [
    "The pool is set low and quiet, its edge detailed to disappear so the water reads as part of the garden rather than an object placed in it.",
    "We wrapped the water in timber and stone chosen to weather gracefully, so the pool settles into the planting instead of standing apart from it.",
  ],
  Gardens: [
    "Planting was layered for year-round structure, dense enough to bind the soil in a single season, with room left to grow into.",
    "Existing canopy was protected to the millimetre, and new planting threaded around it so the garden feels established from the outset.",
  ],
  Carpentry: [
    "Every junction was resolved by hand: concealed fixings, clean returns, and hardwood left to silver in the open air.",
    "The timber was rough-sawn, sanded and finished in oil rather than coated, so it ages honestly with the weather.",
  ],
  Courtyards: [
    "Paving, planting and shade were worked as a single move, so a small footprint reads as generous and calm.",
    "Level changes carve out room without walls, keeping the space open while quietly giving it edges.",
  ],
  Coastal: [
    "Materials were chosen for the salt and the wind, detailed to take the exposure and look the better for it over time.",
    "The layout holds a path to the water and shelter from the southerly, without ever closing off the view.",
  ],
};

/** Two short paragraphs: a hand-written or generated intro, then approach. */
export function projectDescription(item: GalleryItem): string[] {
  const cat = item.categories[0] ?? "Gardens";
  const intro = item.summary ?? CONTEXT[num(item) % CONTEXT.length](item.location);
  const approach =
    (APPROACH[cat] ?? APPROACH.Gardens)[num(item) % 2] ?? "Every detail resolved by hand.";
  return [intro, approach];
}

const ALL = [
  "/images/earlwood-1.webp",
  "/images/earlwood-2.webp",
  "/images/earlwood-3.webp",
  "/images/campsie-1.webp",
  "/images/campsie-2.webp",
  "/images/campsie-3.webp",
  "/images/campsie-4.webp",
  "/images/campsie-5.webp",
  "/images/campsie-6.webp",
  "/images/avalon-1.webp",
  "/images/avalon-2.webp",
  "/images/avalon-3.webp",
  "/images/avalon-4.webp",
  "/images/avalon-5.webp",
  "/images/avalon-6.webp",
  "/images/avalon-7.webp",
  "/images/avalon-8.webp",
  "/images/avalon-9.webp",
  "/images/avalon-10.webp",
  "/images/about-hero.webp",
  "/images/studio-1.webp",
  "/images/studio-2.webp",
  "/images/studio-3.webp",
];

const CATEGORY_POOL: Record<string, string[]> = {
  Pools: [
    "/images/earlwood-2.webp",
    "/images/campsie-4.webp",
    "/images/campsie-3.webp",
    "/images/earlwood-3.webp",
  ],
  Gardens: [
    "/images/avalon-2.webp",
    "/images/avalon-3.webp",
    "/images/avalon-4.webp",
    "/images/earlwood-3.webp",
    "/images/avalon-6.webp",
    "/images/avalon-1.webp",
  ],
  Carpentry: [
    "/images/earlwood-1.webp",
    "/images/campsie-2.webp",
    "/images/campsie-1.webp",
    "/images/studio-1.webp",
    "/images/studio-2.webp",
  ],
  Courtyards: [
    "/images/campsie-1.webp",
    "/images/avalon-3.webp",
    "/images/campsie-4.webp",
    "/images/avalon-4.webp",
  ],
  Coastal: [
    "/images/avalon-1.webp",
    "/images/earlwood-2.webp",
    "/images/campsie-3.webp",
    "/images/avalon-2.webp",
  ],
};

/** Category-matched photos for a project, excluding its hero (and any extras). */
function categoryPhotos(item: GalleryItem, exclude: string[] = []): string[] {
  const pool = CATEGORY_POOL[item.categories[0] ?? "Gardens"] ?? CATEGORY_POOL.Gardens;
  const skip = new Set([item.img, ...exclude]);
  const matched = Array.from(new Set([...pool, ...ALL])).filter((p) => !skip.has(p));
  return matched.length ? matched : Array.from(new Set(pool));
}

/** A single feature image for the info spread (distinct from the banner hero). */
export const projectFeature = (item: GalleryItem): string =>
  item.featureImg ?? categoryPhotos(item)[0] ?? item.img;

/**
 * Five category-matched views for the project's curated gallery — distinct
 * from both the banner hero and the feature image above.
 */
export function projectImages(item: GalleryItem, count = 5): string[] {
  if (item.images && item.images.length > 0) {
    return item.images;
  }
  const photos = categoryPhotos(item, [projectFeature(item)]);
  const start = num(item) % photos.length;
  return Array.from({ length: count }, (_, k) => photos[(start + k) % photos.length] ?? item.img);
}
