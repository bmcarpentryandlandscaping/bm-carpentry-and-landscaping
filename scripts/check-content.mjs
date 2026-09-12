// One runnable check for the content layer. Fails loudly, exits non-zero.
//   1. every default parses against its schema
//   2. project slugs are unique
//   3. every image path any default references exists on disk under public/

import { access } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = fileURLToPath(new URL("..", import.meta.url));

// pathToFileURL is required, not decorative: on Windows a bare absolute path
// throws ERR_UNSUPPORTED_ESM_URL_SCHEME because Node reads "C:" as a scheme.
const load = (rel) => import(pathToFileURL(join(ROOT, rel)).href);
const d = await load("src/lib/defaults.ts");
const s = await load("src/lib/schemas.ts");

const errors = [];

for (const [name, schema, value] of [
  ["HERO", s.Hero, d.HERO],
  ["DISCIPLINES", s.Disciplines, d.DISCIPLINES],
  ["MOSAIC", s.Mosaic, d.MOSAIC],
  ["WORKSHOP", s.Workshop, d.WORKSHOP],
  ["SERVICES_HERO", s.ServicesHero, d.SERVICES_HERO],
  ["SERVICES_COPY", s.ServicesCopy, d.SERVICES_COPY],
  ["SITE_DETAILS", s.SiteDetails, d.SITE_DETAILS],
]) {
  const r = schema.safeParse(value);
  if (!r.success) errors.push(`${name} does not parse: ${JSON.stringify(r.error.issues)}`);
}

const slugs = new Set();
for (const p of d.PROJECTS) {
  if (slugs.has(p.slug)) errors.push(`duplicate project slug: ${p.slug}`);
  slugs.add(p.slug);
  const r = s.ProjectData.safeParse(p.data);
  if (!r.success) errors.push(`project ${p.slug} does not parse: ${JSON.stringify(r.error.issues)}`);
}

for (const t of d.MOSAIC.tiles) {
  if (!slugs.has(t.slug)) errors.push(`mosaic tile points at a missing project: ${t.slug}`);
}

// Collect every local path referenced anywhere in the defaults.
const paths = new Set([
  d.HERO.src,
  ...(d.HERO.poster ? [d.HERO.poster] : []),
  ...d.DISCIPLINES.items.map((i) => i.img),
  ...d.MOSAIC.tiles.map((t) => t.img),
  ...d.WORKSHOP.stages.map((st) => st.img),
  d.SERVICES_HERO.a.src,
  d.SERVICES_HERO.b.src,
  ...d.PROJECTS.flatMap((p) => [
    p.data.cover,
    ...(p.data.feature ? [p.data.feature] : []),
    ...p.data.gallery,
  ]),
]);

for (const p of paths) {
  if (!p.startsWith("/")) continue; // an uploaded Storage URL — not our file to check
  try {
    await access(join(ROOT, "public", p));
  } catch {
    errors.push(`referenced file missing from public/: ${p}`);
  }
}

if (errors.length) {
  console.error(`check-content: ${errors.length} problem(s)`);
  for (const e of errors) console.error("  - " + e);
  process.exit(1);
}
console.log(`check-content: OK — ${paths.size} referenced files all present`);
