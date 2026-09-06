import { test } from "node:test";
import assert from "node:assert/strict";
import { HERO, DISCIPLINES, MOSAIC, WORKSHOP, SERVICES_HERO, PROJECTS } from "../src/lib/defaults.ts";
import { Hero, Disciplines, Mosaic, Workshop, ServicesHero, ProjectData } from "../src/lib/schemas.ts";

test("every default parses against its schema", () => {
  assert.ok(Hero.safeParse(HERO).success);
  assert.ok(Disciplines.safeParse(DISCIPLINES).success);
  assert.ok(Mosaic.safeParse(MOSAIC).success);
  assert.ok(Workshop.safeParse(WORKSHOP).success);
  assert.ok(ServicesHero.safeParse(SERVICES_HERO).success);
  for (const p of PROJECTS) {
    const r = ProjectData.safeParse(p.data);
    assert.ok(r.success, `${p.slug}: ${JSON.stringify(r.error?.issues)}`);
  }
});

test("the defaults still match the shapes the site renders", () => {
  assert.equal(DISCIPLINES.items.length, 4);
  assert.equal(MOSAIC.tiles.length, 10);
  assert.equal(WORKSHOP.stages.length, 5);
  assert.equal(PROJECTS.length, 17);
});

test("project slugs are unique and positions are a dense 0..n-1 range", () => {
  const slugs = PROJECTS.map((p) => p.slug);
  assert.equal(new Set(slugs).size, slugs.length);
  assert.deepEqual(
    PROJECTS.map((p) => p.position).sort((a, b) => a - b),
    PROJECTS.map((_, i) => i),
  );
});

test("every mosaic tile points at a project that exists", () => {
  const slugs = new Set(PROJECTS.map((p) => p.slug));
  for (const t of MOSAIC.tiles) assert.ok(slugs.has(t.slug), `no project for tile slug ${t.slug}`);
});
