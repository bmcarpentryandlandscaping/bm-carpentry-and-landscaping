import type { GalleryItem } from "./gallery.ts";
import { galleryItems, projectSlug, projectYear } from "./gallery.ts";
import type {
  Disciplines,
  Hero,
  Mosaic,
  ProjectData,
  ServicesCopy,
  ServicesHero,
  SiteDetails,
  Workshop,
} from "./schemas.ts";

/**
 * The site's content as it stands in code today, and the fallback the read layer
 * returns whenever Supabase cannot be reached or gives back something that does
 * not parse. Supabase being down must never mean a blank site.
 *
 * These are NOT a second source of truth. Once the client starts editing, the
 * database leads and these drift — that is expected. They only have to stay
 * parseable and renderable, which `npm run check` enforces.
 */

/** From src/app/page.tsx:47-52 */
export const HERO: Hero = {
  kind: "image",
  src: "/images/earlwood-3.webp",
  alt: "A landscaped backyard in Earlwood — lawn and garden beds, timber deck and paved terrace",
};

/**
 * From src/components/WhatWeDo.tsx:12 (the `practices` const).
 * src/app/services/page.tsx:19 holds the same four entries in a different shape
 * (n/t/d, no alt); both now render from this one value.
 */
export const DISCIPLINES: Disciplines = {
  items: [
    {
      label: "Design",
      blurb:
        "From your initial consultation through to the finished product, we guide you through all the steps needed to achieve your vision.",
      img: "/images/dsc09432_hdr.webp",
      alt: "Modern timber-clad home opening onto a designed lawn at dusk",
    },
    {
      label: "Landscaping",
      blurb:
        "From retaining walls and paving to hardscapes and softscapes, we provide complete landscaping solutions tailored to your space.",
      img: "/images/avalon-3.webp",
      alt: "Landscaped garden beds, paving and lawn at Avalon Beach",
    },
    {
      label: "Carpentry",
      blurb:
        "Structural and finish carpentry, decking and cladding, every aspect hand built by our own team.",
      img: "/images/page_4_img_6.jpg",
      alt: "Handcrafted timber landscape stairs meeting a sandstone retaining wall",
    },
    {
      label: "Garden Maintenance",
      blurb:
        "Whether it's maintaining your garden after installation or giving an existing outdoor space the care it needs, our team can help keep your landscape looking its best all year round.",
      img: "/images/campsie-2.webp",
      alt: "Established garden beds and lawn maturing along a rendered wall",
    },
  ],
};

/** From WORK_TILES, src/app/page.tsx:21. Sizes stay in the page as WORK_SIZES. */
export const MOSAIC: Mosaic = {
  tiles: [
    { slug: "earlwood", img: "/images/earlwood-vid-framing-detail-square.webp" },
    { slug: "campsie", img: "/images/campsie-2.webp" },
    { slug: "paddington", img: "/images/from-live-site/live-site-4-hero.webp" },
    { slug: "avalon-beach", img: "/images/avalon-2.webp", pos: "center 60%" },
    { slug: "earlwood", img: "/images/earlwood-planting-tall.webp" },
    { slug: "campsie", img: "/images/campsie-1.webp" },
    { slug: "avalon-beach", img: "/images/avalon-1.webp" },
    { slug: "earlwood", img: "/images/earlwood-home-cover.webp" },
    { slug: "campsie", img: "/images/campsie-4.webp" },
    { slug: "paddington", img: "/images/from-live-site/live-site-16-cara-deck.webp" },
  ],
};

/** From STAGES, src/components/WorkshopProcess.tsx:14. The "01".."05" index is derived. */
export const WORKSHOP: Workshop = {
  stages: [
    {
      name: "Frame",
      img: "/images/avalon-6.webp",
      cap: "Structural timber framing set out across three terrace levels.",
      alt: "Structural timber framing meeting the new deck levels at Earlwood",
    },
    {
      name: "Clad",
      img: "/images/avalon-5.webp",
      cap: "Vertical timber cladding, unifying the facade in low sun.",
      alt: "Timber cladding running up the facade, lit at sunset",
    },
    {
      name: "Deck",
      img: "/images/campsie-5.webp",
      cap: "Hardwood decking laid by hand, every junction mitered.",
      alt: "Carpenter laying hardwood decking boards over the timber frame",
    },
    {
      name: "Plant",
      img: "/images/earlwood-1.webp",
      cap: "Zoned irrigation and dense, terraced planting go in.",
      alt: "Newly planted terraced garden beds with irrigation",
    },
    {
      name: "Settle",
      img: "/images/earlwood-3.webp",
      cap: "The finished garden, resolved and reading at dusk.",
      alt: "The completed Earlwood garden and clad home at dusk",
    },
  ],
};

/** From src/app/services/page.tsx:76 and :103 (both <ParallaxImage>). */
export const SERVICES_HERO: ServicesHero = {
  a: {
    src: "/images/earlwood-home-cover.webp",
    alt: "Timber-clad home and garden, Earlwood",
    caption: "Earlwood",
  },
  b: {
    src: "/images/from-live-site/live-site-16-cara-deck.webp",
    alt: "BM Carpentry and Landscaping",
    caption: "Sydney",
  },
};

/** From src/app/(site)/services/page.tsx — the headings around the hero. */
export const SERVICES_COPY: ServicesCopy = {
  craft: "Our craft",
  heading:
    "Gardens, carpentry and landscaping that respond to the architecture and the land.",
  intro:
    "One Sydney team, designing and building outdoors from carpentry through to landscaping. Four disciplines, one crew: start to finish.",
  disciplinesHeading: "Four disciplines.",
};

/** No licence number yet — the footer shows nothing until one is entered. */
export const SITE_DETAILS: SiteDetails = {
  licence: "",
};

export type ProjectRecord = {
  slug: string;
  position: number;
  published: boolean;
  data: ProjectData;
};

/**
 * GalleryItem -> ProjectData. `id` is carried through because the generators in
 * gallery.ts key their deterministic copy and photo picks off its digits — change
 * the id and a seeded project's generated prose changes with it.
 */
export function toProjectData(item: GalleryItem): ProjectData {
  return {
    id: item.id,
    title: item.title,
    location: item.location,
    year: projectYear(item),
    categories: [...item.categories] as ProjectData["categories"],
    size: item.size,
    ...(item.pos ? { pos: item.pos } : {}),
    ...(item.summary ? { summary: item.summary } : {}),
    cover: item.img,
    ...(item.featureImg ? { feature: item.featureImg } : {}),
    gallery: item.images ?? [],
    ...(item.scope ? { scope: [...item.scope] } : {}),
  };
}

/** Derived from galleryItems, in source order — never hand-transcribed. */
export const PROJECTS: ProjectRecord[] = galleryItems.map((item, i) => ({
  slug: projectSlug(item),
  position: i,
  published: true,
  data: toProjectData(item),
}));
