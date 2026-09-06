import { test } from "node:test";
import assert from "node:assert/strict";
import { findReferences, fitWithin, MAX_EDGE, slugify } from "../src/lib/media.ts";
import { DISCIPLINES, HERO, MOSAIC, PROJECTS, SERVICES_HERO, WORKSHOP } from "../src/lib/defaults.ts";
import type { ProjectRecord } from "../src/lib/defaults.ts";

const all = {
  hero: HERO,
  disciplines: DISCIPLINES,
  mosaic: MOSAIC,
  workshop: WORKSHOP,
  servicesHero: SERVICES_HERO,
};

test("finds the homepage hero", () => {
  // Isolated to the hero bundle: in the real defaults, HERO.src and
  // WORKSHOP.stages[4] ("Settle") legitimately share the same photo
  // (/images/earlwood-3.webp), so `all` would correctly report both.
  assert.deepEqual(findReferences(HERO.src, { hero: HERO }, []), ["Home hero"]);
});

test("names the practice a discipline image belongs to", () => {
  const refs = findReferences(DISCIPLINES.items[2].img, { disciplines: DISCIPLINES }, []);
  assert.deepEqual(refs, ["What we do — Carpentry"]);
});

test("numbers workshop stages from one", () => {
  const refs = findReferences(WORKSHOP.stages[1].img, { workshop: WORKSHOP }, []);
  assert.deepEqual(refs, ["Workshop 02 — Clad"]);
});

test("distinguishes the two services hero slots", () => {
  assert.deepEqual(findReferences(SERVICES_HERO.b.src, { servicesHero: SERVICES_HERO }, []), [
    "Services hero B",
  ]);
});

test("reports a mosaic tile by its position", () => {
  const refs = findReferences(MOSAIC.tiles[3].img, { mosaic: MOSAIC }, []);
  assert.deepEqual(refs, ["Featured tile 04"]);
});

test("reports project cover, feature and gallery slots by name", () => {
  // PROJECTS[0] is not the Earlwood project in source order — look it up by
  // slug so the title in `data` actually matches "Earlwood Deck & Garden".
  const earlwood = PROJECTS.find((p) => p.slug === "earlwood")!;
  const rec = {
    slug: "earlwood",
    position: 0,
    published: true,
    data: {
      ...earlwood.data,
      cover: "/c.webp",
      feature: "/f.webp",
      gallery: ["/g0.webp", "/g1.webp"],
    },
  };
  assert.deepEqual(findReferences("/c.webp", {}, [rec]), ["Earlwood Deck & Garden — cover"]);
  assert.deepEqual(findReferences("/f.webp", {}, [rec]), ["Earlwood Deck & Garden — feature image"]);
  assert.deepEqual(findReferences("/g1.webp", {}, [rec]), ["Earlwood Deck & Garden — gallery 2"]);
});

test("returns every place a photo is reused, not just the first", () => {
  const shared = MOSAIC.tiles[0].img;
  const rec = {
    slug: "x",
    position: 0,
    published: true,
    data: { ...PROJECTS[0].data, cover: shared, gallery: [] },
  };
  const refs = findReferences(shared, all, [rec]);
  assert.ok(refs.length >= 2, `expected multiple references, got ${JSON.stringify(refs)}`);
});

test("an unused url has no references", () => {
  assert.deepEqual(findReferences("/images/never-used-anywhere.webp", all, []), []);
});

test("a malformed project row is skipped rather than throwing", () => {
  // findReferences is called by the delete guard with rows straight out of the
  // database, which may not have been schema-parsed. If a bad row threw here,
  // "cannot check references" would become "delete succeeded" and the client
  // would lose a photo the live site depends on.
  const bad = [
    { slug: "a", position: 0, published: true, data: null },
    { slug: "b", position: 1, published: true, data: undefined },
    null,
    undefined,
  ] as unknown as ProjectRecord[];
  assert.deepEqual(findReferences("/c.webp", {}, bad), []);
});

test("a project row with a non-array gallery does not throw", () => {
  const rows = [
    { slug: "a", position: 0, published: true, data: { ...PROJECTS[0].data, gallery: "nope" } },
    { slug: "b", position: 1, published: true, data: { ...PROJECTS[0].data, gallery: null } },
  ] as unknown as ProjectRecord[];
  assert.deepEqual(findReferences("/never.webp", {}, rows), []);
});

test("a project row missing its title falls back to the slug in the label", () => {
  const rows = [
    {
      slug: "c-slug",
      position: 0,
      published: true,
      data: { ...PROJECTS[0].data, title: undefined, cover: "/c.webp", gallery: [] },
    },
  ] as unknown as ProjectRecord[];
  assert.deepEqual(findReferences("/c.webp", {}, rows), ["c-slug — cover"]);
});

test("fitWithin leaves an image already within the cap alone", () => {
  assert.deepEqual(fitWithin(1200, 800, MAX_EDGE), { width: 1200, height: 800 });
});

test("fitWithin scales the longest edge down and keeps the aspect ratio", () => {
  assert.deepEqual(fitWithin(4800, 3600, 2400), { width: 2400, height: 1800 });
  assert.deepEqual(fitWithin(3600, 4800, 2400), { width: 1800, height: 2400 });
});

test("fitWithin never returns a zero dimension", () => {
  const { width, height } = fitWithin(10000, 3, 2400);
  assert.ok(width >= 1 && height >= 1);
});

test("slugify matches the kebab-casing gallery.ts already uses for slugs", () => {
  assert.equal(slugify("Kiama Boardwalk"), "kiama-boardwalk");
  assert.equal(slugify("Earlwood Deck & Garden"), "earlwood-deck-garden");
  assert.equal(slugify("  Leading and trailing  "), "leading-and-trailing");
  assert.equal(slugify("Bronte — Courtyard"), "bronte-courtyard");
  assert.equal(slugify("100% Timber"), "100-timber");
});

test("slugify never returns an empty string", () => {
  assert.equal(slugify("!!!"), "project");
  assert.equal(slugify(""), "project");
});
