# Client admin — images, labels & projects

**Date:** 2026-08-29
**Status:** approved for build
**Supersedes:** `2026-08-14-client-image-labels-design.md` (captions-only; never implemented — that scope is absorbed here)
**Amended:** 2026-09-01 — host confirmed (Cloudflare Workers), three hardening
decisions added to §2, all file:line claims re-verified against `main` @ `7985f1e`
and corrected in §3.4, §4, §4.2 and §10.

Handover document. Read top to bottom once, then build the phases in order.
Every phase ends in a working, deployable site.

---

## 1. Goal

The client (BM Carpentry & Landscaping) edits the site's imagery and the short
labels attached to it, themselves, in a browser, with no developer and no deploy.

**In scope**

- Homepage: hero (image **or** video), the four "What we do" practices, the
  ten-tile Featured-projects mosaic, the five Workshop stages (Frame / Clad /
  Deck / Plant / Settle).
- Services page: the two hero images and the four discipline cards.
- Projects: full create / edit / delete / reorder / publish, cover image, title,
  location, year, categories, summary.
- Per-project detail galleries: hero, feature image, gallery image list.
- Media library: upload, rename, alt text, delete, reuse across the site.

**Out of scope (v1)**

- Long-form page copy, hero headline, section headings, `brand.ts` strings.
- Journal (`/journal` is disabled in the site today).
- Layout control: tile sizes in the homepage mosaic, stage count, practice
  count. These are hand-tuned; the client swaps content into fixed slots.
- Multiple admin users, roles, audit log, draft/publish staging.
- Redirects when a project slug changes.

---

## 2. Decisions

| Decision | Choice | Why |
| --- | --- | --- |
| Hosting | Cloudflare Workers via `@opennextjs/cloudflare` | Client's chosen host. Next 16 server actions need the Workers adapter; a Pages static export cannot run them. |
| Data | Supabase Postgres | Chosen. Also supplies Auth + Storage, so one vendor covers all three needs. |
| Schema shape | 3 tables, typed JSONB payloads | Adding a field is a Zod edit, not a migration. Normalising each section into its own table would be 8+ tables serving content nothing queries relationally. |
| Auth | Supabase Auth, email + password, invite-only | Real sessions and password reset, no shared secret sent over SMS. No public signup. |
| Authorisation | RLS: anon reads, authenticated writes | The app never holds a service-role key at runtime. A leaked anon key can only read what is already public. |
| Publish | Instant, on save | Server action writes, then purges the cache tag. What the client sees in admin is what is live. |
| Uploads | Resize + WebP **in the browser** before upload | A 9MB phone photo lands ~350KB, matching the existing `.webp` pool. No image service, no per-image cost, fast upload on site wifi. |
| Existing 66 images | Stay in `public/images`, seeded as read-only `media` rows | Day-one site is byte-identical. Zero migration risk. Client cannot delete a photo the site was built on. |
| Structural control | Fixed slots | The 10-tile mosaic packing is hand-verified (`WORK_SIZES`, `src/app/page.tsx:18`) and the Workshop scroll timings are stage-count-dependent. Content is swappable; geometry is not. |
| Failure mode | Fall back to hardcoded defaults | Supabase being down must never mean a blank site. |
| Upload validation | Bucket `allowed_mime_types` + `file_size_limit`, **as well as** the browser pipeline | The browser resize is a convenience, not a control. A valid session can `PUT` straight at Storage and skip it entirely. Only the bucket policy is unbypassable. |
| Login throttle | Per-IP counter in Workers KV, 15-minute window | Supabase Auth throttles too, but the attempt should die at the edge before it costs an Auth request. KV is already bound for the incremental cache — no new dependency. |
| Response headers | CSP, HSTS, frame / referrer / content-type headers; nonce-based `script-src` on `/admin` | The site sends none today. Admin is a credentialed surface: it must not be framable and must not run injected script. |

---

## 3. Architecture

```
Cloudflare Worker  (@opennextjs/cloudflare)
│
├─ (site)   server components ─ getContent() ─ fetch → Supabase PostgREST
│                                 ├ cached by Next tag, backed by Workers KV
│                                 └ falls back to src/lib/defaults.ts on any error
│
└─ (admin)  client forms ─ server actions ─┬─ Supabase (user session, RLS)
                                           ├─ updateTag(...)
                                           └─ Supabase Storage (browser upload)
```

### 3.1 Route-group split

`src/app/layout.tsx` currently mounts `SmoothScroll`, `Cursor`, `Loader`,
`SiteNav`, `SiteFooter` for every route. Admin must not inherit Lenis smooth
scroll or the blend-mode custom cursor — both make form UI unusable.

```
src/app/
  layout.tsx              ← keeps <html>/<body>, font, metadata, JSON-LD only
  (site)/
    layout.tsx            ← SmoothScroll + Cursor + Loader + SiteNav + main + SiteFooter
    page.tsx  about/  services/  projects/  contact/  journal/  privacy/
    not-found.tsx  error.tsx
  (admin)/
    layout.tsx            ← plain shell: admin nav + <Toaster/>, no motion system
    admin/...
```

Route groups do not change URLs. Page files move unmodified.

### 3.2 Read layer — `src/lib/content.ts` (server-only)

Reads go through plain `fetch` to PostgREST rather than `supabase-js`, so Next's
`tags` option applies:

```ts
const rest = (path: string, tags: string[]) =>
  fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: { apikey: ANON, Authorization: `Bearer ${ANON}` },
    next: { tags },
  });
```

Exports, each wrapped in React `cache()` for per-request dedupe, each Zod-parsed,
each returning the matching export from `src/lib/defaults.ts` on **any** failure
(network, missing row, parse error) after one `console.error`:

| Function | Tag | Feeds |
| --- | --- | --- |
| `getHero()` | `content` | homepage hero |
| `getDisciplines()` | `content` | `WhatWeDo` **and** the services discipline cards |
| `getMosaic()` | `content` | homepage Featured-projects tiles |
| `getWorkshop()` | `content` | `WorkshopProcess` stages |
| `getServicesHero()` | `content` | `/services` two hero images |
| `getProjects()` | `projects` | `/projects` masonry, homepage tile links, sitemap |
| `getProject(slug)` | `projects`, `project:{slug}` | `/projects/[slug]` |

`WhatWeDo` and the services discipline cards render **identical** data today
(same four labels, blurbs and images — `WhatWeDo.tsx:12` vs
`services/page.tsx:19`). They share one key. One edit updates both surfaces.

### 3.3 Caching and instant publish

- Tags: `content`, `projects`, `project:{slug}`, `media`.
- Server actions call `updateTag()` after every successful write.
- OpenNext on Cloudflare needs an incremental cache (Workers **KV**) and a tag
  cache (**D1**) bound in `wrangler.jsonc` for `updateTag` to work.

> ⚠️ **Phase 0 must prove this works before anything is built on it.** If the tag
> cache proves unworkable, the documented fallback is to render the affected
> routes dynamically with `export const revalidate = 60` and accept ≤60s
> propagation. Nothing else in this plan changes if that switch is taken.

### 3.4 `/projects/[slug]` rendering change

`generateStaticParams` cannot know about projects the client adds after a build.

- Keep `generateStaticParams` — it prebuilds today's published slugs, so the
  common case stays a static hit.
- Add `export const dynamicParams = true` — verified as *already* the Next
  default in this repo (the flag is set nowhere), so this makes the existing
  behaviour explicit rather than changing it. Unknown slugs already fall through
  to `getProject()` -> `notFound()`; after Phase 6 they resolve from the DB first.
- Both paths are ISR-cached and purged by the `project:{slug}` tag.

---

## 4. Data model

```sql
-- ── media library ───────────────────────────────────────────────────────
create table media (
  id         uuid primary key default gen_random_uuid(),
  url        text not null unique,      -- '/images/x.webp' (repo) or Storage public URL
  name       text not null,             -- client-editable display name
  alt        text not null default '',
  source     text not null default 'upload' check (source in ('repo','upload')),
  kind       text not null default 'image' check (kind in ('image','video')),
  width      int, height int, bytes int,
  created_at timestamptz not null default now()
);

-- ── keyed singleton sections ────────────────────────────────────────────
create table content (
  key        text primary key,          -- 'home.hero' | 'disciplines' | 'home.mosaic'
                                        -- | 'home.workshop' | 'services.hero'
  data       jsonb not null,
  updated_at timestamptz not null default now()
);

-- ── projects ────────────────────────────────────────────────────────────
create table projects (
  id         uuid primary key default gen_random_uuid(),
  slug       text not null unique,
  position   int  not null default 0,
  published  boolean not null default true,
  data       jsonb not null,
  updated_at timestamptz not null default now()
);
create index projects_order on projects (published, position);

-- ── RLS: anon reads, authenticated writes ───────────────────────────────
alter table media    enable row level security;
alter table content  enable row level security;
alter table projects enable row level security;

create policy "public read" on media for select to anon, authenticated using (true);
create policy "auth write"  on media for all    to authenticated using (true) with check (true);
-- repeat both policies for content

-- projects is the exception: anon reads PUBLISHED rows only. The anon key ships
-- to every browser, so `using (true)` here would let anyone read unpublished
-- drafts straight from PostgREST — while §5 and §8 treat `published` as real
-- visibility (an unpublished project must 404 and leave the sitemap). The
-- "auth write" policy is `for all`, which already covers SELECT, so an
-- authenticated admin still sees everything.
create policy "public read" on projects for select to anon          using (published);
create policy "auth write"  on projects for all    to authenticated using (true) with check (true);
```

Storage: bucket `media`, **public read**; insert / update / delete restricted to
`authenticated`. The bucket is created with server-enforced constraints, not just
the client-side pipeline of §6.1:

```
file_size_limit    = 26214400          -- 25MB, the video ceiling
allowed_mime_types = ['image/webp','image/jpeg','image/png','video/mp4']
```

`image/jpeg` and `image/png` stay allowed because the browser pipeline can fail
(`createImageBitmap` on an exotic colour profile) and must be able to fall back to
the original bytes rather than losing the upload.

### 4.1 Zod schemas — `src/lib/schemas.ts`

Single source of truth for admin forms and site readers. The max lengths exist to
protect the typography, which is size-tuned per string.

```ts
const MediaRef = z.object({ src: z.string().min(1), alt: z.string().max(160).default("") });

export const Hero = z.object({
  kind:   z.enum(["image", "video"]),
  src:    z.string().min(1),
  poster: z.string().optional(),         // video only; first-frame fallback
  alt:    z.string().max(160),
});

export const Disciplines = z.object({
  items: z.array(z.object({
    label: z.string().min(1).max(24),    // "Garden Maintenance" = 18
    blurb: z.string().min(1).max(260),
    img:   z.string().min(1),
    alt:   z.string().max(160),
  })).length(4),
});

export const Mosaic = z.object({
  tiles: z.array(z.object({
    slug: z.string().min(1),             // must resolve to a published project
    img:  z.string().min(1),
    pos:  z.string().max(24).optional(), // object-position, e.g. "center 60%"
  })).length(10),
});                                      // sizes stay in code: WORK_SIZES

export const Workshop = z.object({
  stages: z.array(z.object({
    name: z.string().min(1).max(12),     // "Frame" — the "01".. index is generated
    cap:  z.string().min(1).max(90),
    img:  z.string().min(1),
    alt:  z.string().max(160),
  })).length(5),
});

export const ServicesHero = z.object({
  a: MediaRef.extend({ caption: z.string().max(18) }),   // "Earlwood"
  b: MediaRef.extend({ caption: z.string().max(18) }),   // "Sydney"
});

export const ProjectData = z.object({
  title:      z.string().min(1).max(48),
  location:   z.string().min(1).max(48),
  year:       z.number().int().min(2000).max(2100),
  categories: z.array(z.enum(CATEGORIES)).min(1),
  size:       z.enum(["sm", "wide", "tall", "lg"]),
  pos:        z.string().max(24).optional(),
  summary:    z.string().max(400).optional(),  // empty ⇒ generated copy (existing behaviour)
  cover:      z.string().min(1),
  feature:    z.string().optional(),           // empty ⇒ projectFeature() picks one
  gallery:    z.array(z.string()).max(24),     // empty ⇒ projectImages() generates five
});
```

Keeping `summary`, `feature` and `gallery` optional means the existing generator
helpers in `src/lib/gallery.ts` stay as the fallback. Seeding is then a straight
copy of today's values and nothing regresses.

### 4.2 Defaults — `src/lib/defaults.ts`

Today's hardcoded constants move here verbatim and become the fallback:

| Default export | Lifted from |
| --- | --- |
| `HERO` | `src/app/page.tsx:47-52` — an `<img>`, `/images/earlwood-3.webp`. (`public/videos/home-hero.mp4` + `home-hero-poster.webp` exist but are unreferenced; they are what the `kind: "video"` branch is for.) |
| `DISCIPLINES` | `src/components/WhatWeDo.tsx:12` — the const is named **`practices`** (`label`/`blurb`/`img`/`alt`). `src/app/services/page.tsx:19` holds the **same four entries** — blurbs byte-identical, images identical, same order — under a different shape (`n`/`t`/`d`, no `alt`). Both collapse onto the one `Disciplines` schema; `n` is derived from the array index. |
| `MOSAIC` | `WORK_TILES`, `src/app/page.tsx:21` (10 tiles) |
| `WORKSHOP` | `STAGES`, `src/components/WorkshopProcess.tsx:14` (5 stages) |
| `SERVICES_HERO` | `src/app/services/page.tsx:76` and `:103` — both `<ParallaxImage>`, not `<img>`; captions "Earlwood" / "Sydney" |
| `PROJECTS` | `galleryItems`, `src/lib/gallery.ts:44` (17 items, `g01`–`g17`) |

`WORK_SIZES` and the `SPAN` / `ASPECT` maps stay in the page and component —
they are geometry, not content.

---

## 5. Slot inventory

Exactly what the client can change, and where it lands. This is the acceptance
checklist for Phases 4–5.

| # | Surface | Slots | Editable per slot |
| --- | --- | --- | --- |
| 1 | Home hero | 1 | image **or** video, poster (video), alt |
| 2 | What we do / Services disciplines | 4 | label, blurb, image, alt |
| 3 | Home Featured mosaic | 10 | linked project, image, object-position |
| 4 | Home Workshop | 5 | stage name, caption, image, alt |
| 5 | Services hero | 2 | image, caption pill, alt |
| 6 | Projects index | n | published, order, cover, title, location, year, categories, size, summary |
| 7 | Project detail | per project | hero (= cover), feature image, gallery list (reorder / add / remove) |
| 8 | Media library | all | upload, rename, alt, delete (uploads only) |

Deliberately **not** editable: mosaic tile sizes, stage count, practice count,
category list (`CATEGORIES`), page headings, hero headline, process steps on
`/services`, `about` / `contact` imagery.

---

## 6. Admin UX

```
/admin/login              email + password
/admin                    dashboard — 4 cards: Homepage · Services · Projects · Media
/admin/homepage           tabs: Hero · What we do · Featured · Workshop
/admin/services           services hero images (disciplines edited under Homepage, shared)
/admin/projects           list: drag-free reorder (↑/↓), publish toggle, New project
/admin/projects/[id]      project editor: details, cover, feature, gallery
/admin/media              library: grid, search, upload, rename, alt, delete
```

**Shared components** (`src/components/admin/`)

- `ImageSlot` — thumbnail + "Change" button + alt field. The single control used
  by every section editor.
- `MediaPicker` — dialog: searchable grid of `media` rows, filter image/video,
  inline upload with progress, returns a URL.
- `SlotList` — fixed-length list with ↑/↓ reorder. No drag-and-drop library;
  ten items with arrow buttons is enough and works on touch.
- `SaveBar` — sticky footer: dirty indicator, Save, Discard. Save is disabled
  until the form is both dirty and valid.

Every editor is a `react-hook-form` + `zodResolver` client form (both already
installed) posting to a server action, with `sonner` toasts. `shadcn/ui` is
already vendored in `src/components/ui/` and currently unused by the site — the
admin is its first consumer, so no new UI dependency.

**Live preview:** each section editor links to the public page anchored at that
section (`/#work`, `/services`). No embedded iframe preview in v1.

### 6.1 Upload pipeline — `src/lib/upload.ts` (client)

1. Accept `image/*` and `video/mp4`.
2. Images: `createImageBitmap` → canvas, longest edge capped at **2400px** →
   `canvas.toBlob(blob, "image/webp", 0.82)`.
3. Video: no transform (a browser cannot transcode). Reject over **25MB**, mp4 only.
4. Upload to Storage `media/{yyyy}/{uuid}.{ext}` via the browser Supabase client
   using the admin's session.
5. Insert a `media` row: `name` = original filename minus extension, plus
   `width`, `height`, `bytes`, `kind`.
6. Max 3 concurrent uploads, per-file progress.

### 6.2 Safety rails

| Rail | Behaviour |
| --- | --- |
| Delete media | Blocked while referenced. The dialog says where: "Used in 3 places: Home hero, Workshop 02, Earlwood gallery". |
| Repo media (`source='repo'`) | Rename and alt allowed; delete blocked. |
| Slug change | Warns that existing links will break, requires confirm. No redirect in v1. |
| Mosaic tile project | Select is limited to published projects. Unpublishing a project used by a tile warns first. |
| Delete project | Confirm dialog; blocked while referenced by a mosaic tile. |
| Empty required slot | Zod rejects at the action; the form cannot submit. |
| Server action auth | Every action re-checks the Supabase session itself. Middleware is not the authorisation boundary — a server action is a public endpoint. |
| `/admin` indexing | `robots.ts` disallows `/admin`; `sitemap.ts` excludes it. |
| Login brute force | Per-IP attempt counter in Workers KV: 8 failures in 15 minutes returns a generic failure without calling Supabase Auth. Counter clears on success. |
| Direct Storage upload | Bucket `file_size_limit` + `allowed_mime_types` reject anything the browser pipeline would have rejected, even when the pipeline is skipped. |
| Clickjacking / injection on `/admin` | `frame-ancestors 'none'` + nonce-based `script-src`, set per-request in middleware. |
| Session cookies | `@supabase/ssr` cookie helpers only — `httpOnly`, `secure`, `sameSite=lax`. No token in `localStorage`, no token handed to a client component. |

---

### 6.3 Hardening detail

**Response headers.** Static headers ship from `next.config.ts` for every route;
the CSP is set per-request in `src/middleware.ts` because it needs a fresh nonce.

| Header | Value |
| --- | --- |
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains; preload` |
| `X-Content-Type-Options` | `nosniff` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `X-Frame-Options` | `DENY` |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=()` |
| `Content-Security-Policy` (`/admin/*`) | `default-src 'self'; script-src 'self' 'nonce-{n}' 'strict-dynamic'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https://{project}.supabase.co; media-src 'self' https://{project}.supabase.co; connect-src 'self' https://{project}.supabase.co; frame-ancestors 'none'; base-uri 'none'; form-action 'self'` |
| `Content-Security-Policy` (site) | the same, minus the nonce, plus `'unsafe-inline'` on `script-src` |

> The public site keeps `'unsafe-inline'` on `script-src`: it renders a JSON-LD
> `<script>` via `dangerouslySetInnerHTML` (`layout.tsx:88`) plus Next's own inline
> boot code. Tightening the site to a nonce is a separate change, out of scope
> here — `/admin` is the credentialed surface and it gets the strict policy.
> `style-src` keeps `'unsafe-inline'` everywhere: Tailwind v4 and the motion
> system write inline custom properties by design.

**Login throttle** — `src/lib/ratelimit.ts`, used only by the login action:

```
key    login:{ip} in the KV namespace already bound for the incremental cache
rule   8 failures / 15 min -> reject before Supabase Auth is called
reset  cleared on a successful login
```

On a KV error it fails **open**, not closed: KV being unavailable must never lock
the client out of their own site. Supabase Auth's own throttle is the second layer.

**Auth boundary.** `src/middleware.ts` redirects unauthenticated `/admin/*` to
`/admin/login`, but it is a redirect, not the authorisation boundary — a server
action is a public HTTP endpoint and is reachable without ever passing through
middleware. Every action therefore starts with the same `requireSession()` call
from `src/lib/auth.ts` and returns early if it fails. The Phase 3 check asserts
this by calling an action with no cookie.

---

## 7. Environment

New dependencies: `@supabase/supabase-js`, `@supabase/ssr`,
`@opennextjs/cloudflare`, `wrangler` (dev).

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=      # seed script ONLY — never imported by app code
```

Committed as `.env.example` with empty values. Real values live in `.env.local`
and in Cloudflare Worker secrets. The runtime never needs the service-role key:
writes authorise through the admin's own session against RLS.

---

## 8. Build phases

Eight phases. Each is independently shippable and ends with a stated check.
Estimates assume one developer.

### Phase 0 — Infrastructure spike (~0.5 day) · BLOCKING

1. Create the Supabase project. Run the schema from §4. Create the `media`
   bucket with its policies **and its `file_size_limit` / `allowed_mime_types`**.
   Create the client's user in the dashboard.
2. Add `@opennextjs/cloudflare` + `wrangler`. Create `wrangler.jsonc` with a KV
   namespace binding and a D1 database binding; create `open-next.config.ts`
   with the KV incremental cache and D1 tag cache. The same KV namespace backs
   the login throttle (§6.3).
3. Deploy a throwaway route that reads one `content` row and a server action
   that writes it and calls `updateTag`.

**Check:** on the deployed Worker, the write is visible on reload within seconds
without a redeploy. If not, switch to the §3.3 fallback and record that decision
in this file before continuing.

### Phase 1 — Content layer, defaults, seed (~1 day)

1. `src/lib/schemas.ts` — §4.1.
2. `src/lib/defaults.ts` — §4.2, values copied verbatim from the current files.
3. `src/lib/content.ts` — §3.2, with the fallback behaviour.
4. `scripts/seed.mjs` — writes `defaults.ts` into Supabase using the
   service-role key, plus one `media` row per file in `public/images` and
   `public/videos` with `source='repo'`. Idempotent (upsert on key / slug / url).
5. Delete `src/lib/projects.ts`. Verified this session: **zero importers** remain
   anywhere in `src/`. It is dead weight and a second source of truth.
6. `scripts/check-content.mjs` — the one runnable check: every default parses
   against its schema; project slugs are unique; every image path referenced by
   a default exists on disk under `public/`. Wire it into `npm run check`.

**Check:** `node scripts/check-content.mjs` passes; seed run twice produces no
duplicates.

### Phase 2 — Site reads from the content layer (~1 day)

Swap each consumer from its constant to its `getX()` call. `WhatWeDo` and
`WorkshopProcess` are `"use client"` — they take their data as props from the
server page rather than fetching. No visual change should be possible.

Files: `src/app/page.tsx`, `src/components/WhatWeDo.tsx`,
`src/components/WorkshopProcess.tsx`, `src/app/services/page.tsx`,
`src/app/projects/page.tsx`, `src/components/ProjectGallery.tsx`,
`src/app/projects/[slug]/page.tsx`, `src/app/sitemap.ts`.

**Check:** with Supabase seeded, and again with `NEXT_PUBLIC_SUPABASE_URL`
deliberately blanked, every page renders exactly as it does on `main` today.
Compare screenshots of `/`, `/services`, `/projects` and one project page.

### Phase 3 — Route-group split + auth (~1 day)

1. Move site routes into `src/app/(site)/`; thin the root layout to
   `<html>`/`<body>` + font + metadata + JSON-LD.
2. `src/app/(admin)/layout.tsx`, `/admin/login`, `src/middleware.ts` guarding
   `/admin/*` via `@supabase/ssr` cookies, plus `requireSession()` in
   `src/lib/auth.ts` for every action to call.
3. `robots.ts` disallow `/admin`.
4. Security headers in `next.config.ts` and the per-request CSP nonce in
   middleware (§6.3).
5. `src/lib/ratelimit.ts` and its use in the login action (§6.3).

**Check:** every public URL is unchanged and still motion-complete; `/admin`
while logged out redirects to `/admin/login`; an action `POST`ed with no cookie
is rejected by the action itself, not by middleware; nine bad logins in a row
from one IP get throttled; `curl -I` on `/` and `/admin/login` shows the header
set from §6.3.

### Phase 4 — Media library (~1.5 days)

`/admin/media`, `src/lib/upload.ts`, `MediaPicker`, `ImageSlot`, the
reference-counting delete guard, and the `media` server actions.

**Check:** upload a 9MB phone JPEG — it lands under ~500KB as `.webp`, appears
in the grid, is renamable, and deleting a repo-sourced image is refused.

### Phase 5 — Homepage + services editors (~2 days)

`/admin/homepage` (Hero · What we do · Featured · Workshop) and
`/admin/services`, plus their server actions and `updateTag('content')`.

**Check:** change each of slots 1–5 in §5, confirm each appears on the live site
within seconds and that switching the hero to a video plays and loops correctly.

### Phase 6 — Projects (~2.5 days)

`/admin/projects` list (reorder, publish, delete, new) and
`/admin/projects/[id]` (details, cover, feature, gallery add/remove/reorder),
with `updateTag('projects')` and `updateTag('project:'+slug)`.

**Check:** create a project end to end, see it on `/projects` and at its own URL;
unpublish it and confirm it disappears from the index, the sitemap, and returns
404; the mosaic tile guard fires when its project is unpublished.

### Phase 7 — Deploy + handover (~1 day)

1. Cloudflare Worker deploy, custom domain, secrets set.
2. Verify caching end to end on the real domain: edit, reload, live in seconds.
3. Lighthouse pass on `/` and `/projects` against the pre-change numbers.
4. Write `docs/CLIENT-GUIDE.md`: how to log in, swap a hero, add a project,
   what image sizes to shoot, what they must not do.
5. Walk the client through it live once.

**Total: ~10.5 developer-days.**

---

## 9. Risks

| Risk | Mitigation |
| --- | --- |
| OpenNext tag cache does not behave on Workers | Phase 0 proves it before anything depends on it; documented ≤60s fallback. |
| Video egress on Supabase free tier (1GB storage / 5GB egress) | Photos are fine. Hero video is the risk. 25MB cap in v1; move video to Cloudflare Stream or R2 if the client swaps it often. |
| Client uploads a portrait phone photo into a landscape slot | `ImageSlot` shows the real crop at the slot's aspect ratio, plus an object-position control on the slots that already support one. |
| Client writes a 60-character stage name and breaks the type | Zod max lengths per §4.1, enforced in the form and again in the action. |
| Client deletes a photo the site uses | Reference-counting delete guard (§6.2). |
| Long-term drift between `defaults.ts` and the DB | Defaults are a failure fallback, not a second source of truth. `check-content.mjs` keeps them parseable; they are not expected to track client edits. |

---

## 10. Notes for whoever builds this

- `src/lib/projects.ts` (137 lines, the old `Project[]`) has **zero importers** —
  re-verified this session; the homepage already reads `gallery.ts`. Delete it in
  Phase 1; do not extend it.
- Three components read their data by module import rather than by prop and must
  be converted to take props from the server page in Phase 2: `WhatWeDo.tsx`
  (`practices`), `WorkshopProcess.tsx` (`STAGES`), and `ProjectGallery.tsx`
  (`galleryItems`, read inside `useMemo` at lines 23–33). All three are
  `"use client"`.
- `WorkshopProcess` stages carry an authored `n` (`"01"`…`"05"`) that this spec
  treats as generated. Derive it from the array index on the way out of
  `getWorkshop()` and keep it out of the schema. `WorkshopProcess.tsx:227` also
  hardcodes `0{STAGES.length}` — right for 5 stages, wrong at 10; the count stays
  fixed per §1, but pad it properly while the file is open.
- `GalleryItem.images` and `.featureImg` are declared in the type and used by
  **no** item. They are where `ProjectData.gallery` and `.feature` land — the
  shape already exists, nothing needs inventing.
- `WhatWeDo.tsx:109` already branches on `img.endsWith(".mp4")` to render a
  `<video>`. No current entry uses it; the media picker makes it reachable.
- The site uses raw `<img>`, not `next/image`. Keep it that way — it sidesteps
  the image-optimiser question on Workers entirely, and the browser-side WebP
  pipeline already does the resizing that `next/image` would.
- `src/lib/gallery.ts` generator helpers (`projectDescription`, `projectFeature`,
  `projectImages`, `projectScope`, `projectYear`) stay. They are the fallback
  for every optional field and are why seeding cannot regress the site.
- Existing Google-Fonts and `globals.css` ordering constraints in `CLAUDE.md`
  still apply. The admin uses the same stylesheet; it just does not mount the
  motion system.
- Update `CLAUDE.md` at the end of Phase 6 — the Data and Routing sections will
  be materially wrong by then.
