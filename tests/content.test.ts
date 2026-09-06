import { test, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { HERO, DISCIPLINES, PROJECTS } from "../src/lib/defaults.ts";

const realFetch = globalThis.fetch;

// The module reads env at import time, so set it before the dynamic import below.
process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-test-key";

const fresh = async () => await import(`../src/lib/content.ts?t=${Math.random()}`);

afterEach(() => {
  globalThis.fetch = realFetch;
});

test("falls back to defaults when the network throws", async () => {
  globalThis.fetch = async () => {
    throw new Error("ECONNREFUSED");
  };
  const { getHero } = await fresh();
  assert.deepEqual(await getHero(), HERO);
});

test("falls back to defaults on a non-2xx response", async () => {
  globalThis.fetch = async () => new Response("nope", { status: 500 });
  const { getDisciplines } = await fresh();
  assert.deepEqual(await getDisciplines(), DISCIPLINES);
});

test("falls back to defaults when the row is missing", async () => {
  globalThis.fetch = async () => Response.json([]);
  const { getHero } = await fresh();
  assert.deepEqual(await getHero(), HERO);
});

test("falls back to defaults when the stored data does not parse", async () => {
  globalThis.fetch = async () => Response.json([{ data: { kind: "gif", src: "" } }]);
  const { getHero } = await fresh();
  assert.deepEqual(await getHero(), HERO);
});

test("returns stored data when it parses", async () => {
  const stored = { kind: "video", src: "/videos/home-hero.mp4", poster: "/p.webp", alt: "x" };
  globalThis.fetch = async () => Response.json([{ data: stored }]);
  const { getHero } = await fresh();
  assert.deepEqual(await getHero(), stored);
});

test("getProjects falls back to the default project list", async () => {
  globalThis.fetch = async () => {
    throw new Error("down");
  };
  const { getProjects } = await fresh();
  const items = await getProjects();
  assert.equal(items.length, PROJECTS.length);
  assert.equal(items[0].title, PROJECTS[0].data.title);
});

test("getProjects drops rows that do not parse rather than failing the page", async () => {
  globalThis.fetch = async () =>
    Response.json([
      { slug: "good", position: 0, published: true, data: PROJECTS[0].data },
      { slug: "bad", position: 1, published: true, data: { title: "no other fields" } },
    ]);
  const { getProjects } = await fresh();
  const items = await getProjects();
  assert.equal(items.length, 1);
  assert.equal(items[0].slug, "good");
});

test("getProject returns null for an unknown slug", async () => {
  globalThis.fetch = async () => Response.json([]);
  const { getProject } = await fresh();
  assert.equal(await getProject("does-not-exist"), null);
});

import { resolveMosaic } from "../src/lib/content.ts";
import type { GalleryItem } from "../src/lib/gallery.ts";

const item = (slug: string, title: string): GalleryItem => ({
  id: "g01",
  title,
  location: "Sydney",
  categories: ["Gardens"],
  img: "/cover.webp",
  size: "sm",
  slug,
});

test("resolveMosaic links each tile to its project", () => {
  const out = resolveMosaic(
    [{ slug: "earlwood", img: "/a.webp", pos: "center 60%" }],
    [item("earlwood", "Earlwood Deck & Garden")],
  );
  assert.equal(out.length, 1);
  assert.equal(out[0].title, "Earlwood Deck & Garden");
  assert.equal(out[0].href, "/projects/earlwood");
  assert.equal(out[0].img, "/a.webp"); // the tile's photo wins, not the project cover
  assert.equal(out[0].pos, "center 60%");
});

test("resolveMosaic keeps the tile when its project is gone, so the packing survives", () => {
  const out = resolveMosaic([{ slug: "avalon-beach", img: "/a.webp" }], []);
  assert.equal(out.length, 1);
  assert.equal(out[0].title, "Avalon Beach"); // title-cased from the slug
  assert.equal(out[0].location, "");
  assert.equal(out[0].href, "/projects"); // the index, never a 404
});

test("resolveMosaic returns one tile per input tile, always", () => {
  const tiles = Array.from({ length: 10 }, (_, i) => ({ slug: `x${i}`, img: `/x${i}.webp` }));
  assert.equal(resolveMosaic(tiles, []).length, 10);
});
