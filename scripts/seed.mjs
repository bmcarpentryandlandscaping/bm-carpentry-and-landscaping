// Seeds Supabase from src/lib/defaults.ts plus every image and video already in
// public/. Idempotent: upserts on content.key, projects.slug and media.url, so
// running it twice is a no-op.
//
// This is the ONLY file permitted to read SUPABASE_SERVICE_ROLE_KEY. It writes
// past RLS on purpose; nothing under src/ may import it or that key.

import { readdir, stat } from "node:fs/promises";
import { join, relative, extname, basename } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = fileURLToPath(new URL("..", import.meta.url));

// pathToFileURL is required, not decorative: on Windows a bare absolute path
// throws ERR_UNSUPPORTED_ESM_URL_SCHEME because Node reads "C:" as a scheme.
const {
  DISCIPLINES,
  HERO,
  MOSAIC,
  PROJECTS,
  SERVICES_COPY,
  SERVICES_HERO,
  SITE_DETAILS,
  WORKSHOP,
} = await import(
  pathToFileURL(join(ROOT, "src/lib/defaults.ts")).href
);

const URL_BASE = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!URL_BASE || !KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

async function upsert(table, rows, onConflict) {
  if (rows.length === 0) return;
  const res = await fetch(
    `${URL_BASE}/rest/v1/${table}?on_conflict=${onConflict}`,
    {
      method: "POST",
      headers: {
        apikey: KEY,
        Authorization: `Bearer ${KEY}`,
        "Content-Type": "application/json",
        Prefer: "resolution=merge-duplicates,return=minimal",
      },
      body: JSON.stringify(rows),
    },
  );
  if (!res.ok) {
    console.error(`${table}: HTTP ${res.status}`, await res.text());
    process.exit(1);
  }
  console.log(`${table}: upserted ${rows.length}`);
}

/** Every file under public/images and public/videos, as a read-only media row. */
async function repoMedia() {
  const out = [];
  for (const dir of ["public/images", "public/videos"]) {
    const walk = async (abs) => {
      for (const entry of await readdir(abs, { withFileTypes: true })) {
        const full = join(abs, entry.name);
        if (entry.isDirectory()) {
          await walk(full);
          continue;
        }
        const ext = extname(entry.name).toLowerCase();
        const kind = ext === ".mp4" ? "video" : "image";
        if (![".webp", ".jpg", ".jpeg", ".png", ".mp4"].includes(ext)) continue;
        const { size } = await stat(full);
        out.push({
          url: "/" + relative(join(ROOT, "public"), full).split("\\").join("/"),
          name: basename(entry.name, ext),
          alt: "",
          source: "repo",
          kind,
          bytes: size,
        });
      }
    };
    await walk(join(ROOT, dir));
  }
  return out;
}

const content = [
  { key: "home.hero", data: HERO },
  { key: "disciplines", data: DISCIPLINES },
  { key: "home.mosaic", data: MOSAIC },
  { key: "home.workshop", data: WORKSHOP },
  { key: "services.hero", data: SERVICES_HERO },
  { key: "services.copy", data: SERVICES_COPY },
  { key: "site.details", data: SITE_DETAILS },
];

await upsert("content", content, "key");
await upsert("projects", PROJECTS, "slug");
await upsert("media", await repoMedia(), "url");
console.log("seed complete");
