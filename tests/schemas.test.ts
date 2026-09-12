import { test } from "node:test";
import assert from "node:assert/strict";
import {
  Hero,
  Disciplines,
  Mosaic,
  Workshop,
  ServicesHero,
  ProjectData,
  CONTENT_SCHEMAS,
  SiteDetails,
} from "../src/lib/schemas.ts";
import {
  projectDescription,
  projectFeature,
  projectImages,
  projectScope,
  projectYear,
} from "../src/lib/gallery.ts";
import { toGalleryItem } from "../src/lib/content.ts";

const discipline = { label: "Design", blurb: "Short.", img: "/a.webp", alt: "" };
const tile = { slug: "earlwood", img: "/a.webp" };
const stage = { name: "Frame", cap: "A caption.", img: "/a.webp", alt: "" };

test("Hero accepts an image and a video with a poster", () => {
  assert.ok(Hero.safeParse({ kind: "image", src: "/a.webp", alt: "x" }).success);
  assert.ok(
    Hero.safeParse({ kind: "video", src: "/a.mp4", poster: "/p.webp", alt: "x" }).success,
  );
});

test("Hero rejects an unknown kind and an empty src", () => {
  assert.equal(Hero.safeParse({ kind: "gif", src: "/a.gif", alt: "" }).success, false);
  assert.equal(Hero.safeParse({ kind: "image", src: "", alt: "" }).success, false);
});

test("Disciplines requires exactly four items", () => {
  assert.ok(Disciplines.safeParse({ items: Array(4).fill(discipline) }).success);
  assert.equal(Disciplines.safeParse({ items: Array(3).fill(discipline) }).success, false);
  assert.equal(Disciplines.safeParse({ items: Array(5).fill(discipline) }).success, false);
});

test("a discipline label over 24 characters is rejected", () => {
  const long = { ...discipline, label: "x".repeat(25) };
  assert.equal(
    Disciplines.safeParse({ items: [long, discipline, discipline, discipline] }).success,
    false,
  );
});

test("Mosaic requires exactly ten tiles", () => {
  assert.ok(Mosaic.safeParse({ tiles: Array(10).fill(tile) }).success);
  assert.equal(Mosaic.safeParse({ tiles: Array(9).fill(tile) }).success, false);
});

test("Workshop requires exactly five stages and a name of at most 12 chars", () => {
  assert.ok(Workshop.safeParse({ stages: Array(5).fill(stage) }).success);
  assert.equal(Workshop.safeParse({ stages: Array(4).fill(stage) }).success, false);
  const long = { ...stage, name: "x".repeat(13) };
  assert.equal(
    Workshop.safeParse({ stages: [long, stage, stage, stage, stage] }).success,
    false,
  );
});

test("ServicesHero caption is capped at 18 characters", () => {
  const ok = { src: "/a.webp", alt: "", caption: "Earlwood" };
  assert.ok(ServicesHero.safeParse({ a: ok, b: ok }).success);
  assert.equal(
    ServicesHero.safeParse({ a: { ...ok, caption: "x".repeat(19) }, b: ok }).success,
    false,
  );
});

test("MediaRef requires alt to be present, though it may be empty", () => {
  // No `.default("")` — see the comment on MediaRef. An absent alt must fail, or
  // the zodResolver input/output split returns and breaks ServicesHeroEditor.
  const withAlt = { src: "/a.webp", alt: "", caption: "Earlwood" };
  const noAlt = { src: "/a.webp", caption: "Earlwood" };
  assert.ok(ServicesHero.safeParse({ a: withAlt, b: withAlt }).success);
  assert.equal(ServicesHero.safeParse({ a: noAlt, b: noAlt }).success, false);
});

test("ProjectData requires a known category and a real year", () => {
  const base = {
    id: "g01",
    title: "Kiama Boardwalk",
    location: "Kiama, South Coast",
    year: 2024,
    categories: ["Carpentry"],
    size: "lg",
    cover: "/images/earlwood-3.webp",
    gallery: [],
  };
  assert.ok(ProjectData.safeParse(base).success);
  assert.equal(ProjectData.safeParse({ ...base, categories: ["Sheds"] }).success, false);
  assert.equal(ProjectData.safeParse({ ...base, categories: [] }).success, false);
  assert.equal(ProjectData.safeParse({ ...base, year: 1999 }).success, false);
  assert.equal(ProjectData.safeParse({ ...base, gallery: Array(25).fill("/a.webp") }).success, false);

  // Blank is allowed and means "unknown" — the page hides the Completed row
  // rather than showing a derived year, which would be a false claim.
  assert.ok(ProjectData.safeParse({ ...base, year: undefined }).success);
  const { year: _omitted, ...noYear } = base;
  assert.ok(ProjectData.safeParse(noYear).success);

  // scope: up to 6 lines, none blank.
  assert.ok(ProjectData.safeParse({ ...base, scope: ["Design", "Construction"] }).success);
  assert.equal(
    ProjectData.safeParse({ ...base, scope: Array(7).fill("Item") }).success,
    false,
  );
  assert.equal(ProjectData.safeParse({ ...base, scope: [""] }).success, false);
});

test("optional project fields stay optional — absent now means absent, nothing is generated", () => {
  const parsed = ProjectData.parse({
    id: "g01",
    title: "T",
    location: "L",
    year: 2024,
    categories: ["Gardens"],
    size: "sm",
    cover: "/a.webp",
    gallery: [],
  });
  assert.equal(parsed.summary, undefined);
  assert.equal(parsed.feature, undefined);

  // The renderers must return nothing for these, not invent a stand-in.
  const item = toGalleryItem({ slug: "t", position: 0, published: true, data: parsed });
  assert.deepEqual(projectDescription(item), []);
  assert.equal(projectFeature(item), undefined);
  assert.deepEqual(projectImages(item), []);
  // An authored year is passed straight through; only an absent one is absent.
  assert.equal(projectYear(item), 2024);
  const { year: _omitted, ...noYear } = parsed;
  assert.equal(
    projectYear(toGalleryItem({ slug: "t", position: 0, published: true, data: noYear })),
    undefined,
  );

  // scope is the one field that keeps its category-derived fallback on
  // purpose — the client chose to keep it, editability just sits on top.
  assert.deepEqual(projectScope(item), ["Landscape design", "Construction", "Planting"]);
  const authored = { ...parsed, scope: ["Custom joinery", "On-site milling"] };
  assert.deepEqual(
    projectScope(toGalleryItem({ slug: "t", position: 0, published: true, data: authored })),
    ["Custom joinery", "On-site milling"],
  );
});

test("CONTENT_SCHEMAS covers exactly the singleton keys", () => {
  assert.deepEqual(Object.keys(CONTENT_SCHEMAS).sort(), [
    "disciplines",
    "home.hero",
    "home.mosaic",
    "home.workshop",
    "services.copy",
    "services.hero",
    "site.details",
  ]);
});

test("an empty licence still parses — the footer hides it", () => {
  assert.ok(SiteDetails.safeParse({ licence: "" }).success);
});
