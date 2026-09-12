# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm install` — install dependencies
- `npm run dev` — start Next.js dev server (Turbopack)
- `npm run build` — production build (Turbopack, generates static pages for `/projects/[slug]` and `/journal/[slug]`)
- `npm run start` — serve the production build
- `npm run lint` — ESLint (flat config, native to Next.js 16)
- `npm run format` — Prettier write
- `npm test` — runs `tests/**/*.test.ts` on Node's built-in test runner (`node --test`). 50 tests, no framework — pure logic only (schemas, defaults, media reference-finding, ratelimit), no DOM/component tests.
- `npm run check` — `scripts/check-content.mjs` (defaults parse against the live schemas) + lint + test. Run this before calling anything done.
- `npm run seed` — `node --env-file=.env.local scripts/seed.mjs`; seeds Supabase from `src/lib/defaults.ts` plus everything already in `public/`. Idempotent. Needs `SUPABASE_SERVICE_ROLE_KEY` in `.env.local`.
- `npm run preview` — `opennextjs-cloudflare build && opennextjs-cloudflare preview`; runs the Workers build locally.
- `npm run deploy` — `opennextjs-cloudflare build && opennextjs-cloudflare deploy`; ships to Cloudflare Workers. See Deploy below.
- `npm run cf-typegen` — regenerates `cloudflare-env.d.ts` from `wrangler.jsonc`'s bindings.

## Stack

- **Next.js 16.3.4** App Router on **React 19** with **Turbopack**. The floor is set by `@opennextjs/cloudflare`'s peer range, not by a feature this app uses.
- **Supabase** (Postgres + Auth + Storage) is the datastore: a `content` table for the seven singleton homepage/services/site slots, a `projects` table, a `media` table, and Storage for uploads. RLS-gated; the admin reads/writes through the user's own session, never a service key.
- **`@opennextjs/cloudflare` + `wrangler`** deploy the app to Cloudflare Workers (KV-backed ISR cache, D1-backed tag cache). See Deploy below.
- **Tailwind v4** via `@tailwindcss/postcss` — config in `src/app/globals.css` (`@theme inline`).
- **Lenis** for inertial smooth scroll + **GSAP** (with `ScrollTrigger`) for scrub-tied/pinned scroll choreography, on the public site only. Lenis's RAF is delegated to `gsap.ticker` so ScrollTrigger stays in sync.
- **shadcn/ui** (style: `new-york`) in `src/components/ui/` — the admin is its consumer (forms, dialogs, tabs, switches, sonner toasts). Not used by the public site.
- `@/*` path alias → `src/*`.

## Brand

The site is for **BM Carpentry & Landscaping** (Sydney). Brand display rules: short mark `BM.` (with the period animated on hover), tagline `carpentry & landscape`, full company name only in metadata/contact/footer copyright. All brand strings live in `src/lib/brand.ts` — change them there.

## Architecture

### Routing (App Router)
The App Router is split into two route groups with different shells:

- **`(site)`** — the public site: `/`, `/services`, `/about`, `/projects`, `/projects/[slug]`, `/journal`, `/journal/[slug]`, `/contact`, `/privacy`, plus its own `not-found.tsx`/`error.tsx`. `(site)/layout.tsx` mounts `<SiteChrome>`.
- **`(admin)`** — `/admin/*`. `(admin)/layout.tsx` mounts `<AdminNav>` + `<Toaster>`, deliberately **not** `<SiteChrome>` — Lenis hijacks scroll and the difference-blend cursor hides the caret, both unusable in form UI. See Admin below.

`src/components/SiteChrome.tsx` factors out the public shell (`<SmoothScroll>`, `<Cursor>`, `<Loader>`, `<SiteNav>`, `<main>`, `<SiteFooter>`) so it can be mounted twice: once by `(site)/layout.tsx`, and again by the **root** `src/app/not-found.tsx` — a global 404 renders under the root layout, which carries no nav/footer of its own, so it wraps `(site)/not-found.tsx`'s body in `<SiteChrome>` explicitly.

`src/app/layout.tsx` is the root HTML shell shared by both groups: self-hosts Hanken Grotesk via `next/font`, sets root metadata (template: `` "%s — {fullName}" ``), `metadataBase`, and the `LocalBusiness` JSON-LD block.

`src/middleware.ts` runs on every request: refreshes the Supabase auth cookie, mints a per-request CSP nonce (admin only — the public site's script-src stays `'unsafe-inline'` so the JSON-LD block and Next's own boot script aren't blocked), and redirects unauthenticated `/admin/*` to `/admin/login`. **That redirect is a convenience for humans, not the authorisation boundary** — see Admin below.

- **Dynamic case studies**: `/projects/[slug]` — `generateStaticParams()` over `getProjects()` (`src/lib/content.ts`). Each page renders a full-bleed banner → info section → mixed-aspect gallery → next-project peek → back link.
- **Dynamic journal articles**: `/journal/[slug]` via `generateStaticParams()` over `src/lib/journal.ts`. Journal is currently disabled — `/journal` and `/journal/[slug]` both call `notFound()` before their markup runs; the routes and data are left intact as a one-line revert.

### Data
- `src/lib/brand.ts` — single source of truth for brand/contact strings. The licence number is NOT here: it is client-editable (`site.details` → `getSiteDetails`), blank until they enter one, and the footer renders nothing for an empty string.
- `src/lib/schemas.ts` — the contract. Zod schemas for the seven `content` singletons (`Hero`, `Disciplines`, `Mosaic`, `Workshop`, `ServicesHero`, `ServicesCopy`, `SiteDetails`, collected in `CONTENT_SCHEMAS`), `ProjectData`, and `MediaRow`. Every admin form and every server action validates against these; `content.ts` does too, on the way out.
- `src/lib/content.ts` — **the only module that reads content out of Supabase**, for the public site. Reads go through plain `fetch` to PostgREST (not `supabase-js`) so `next: { tags }` applies, which is what lets a server action purge a specific page with `updateTag()`. Every export falls back to `defaults.ts` on any failure — network error, non-2xx, missing row, or a row that fails its Zod schema — logging once rather than ever rendering a blank site. Exports `getHero`/`getDisciplines`/`getMosaic`/`getWorkshop`/`getServicesHero`/`getServicesCopy`/`getSiteDetails` (schema-backed singletons), `getProjects`/`getProject(slug)`, and `resolveMosaic` (pairs a mosaic tile with its project, falling back to a slug-derived title and a link to `/projects` if the project was unpublished — never dropping a tile, since the ten fixed tile sizes tile a gapless grid).
- `src/lib/defaults.ts` — the fallback `content.ts` reads on failure, transcribed from the code that predates the admin (hero, disciplines, mosaic, workshop, services hero, and `PROJECTS`, derived from `gallery.ts`'s `galleryItems` — never hand-transcribed). Not a second source of truth: once the client edits content, the database leads and these drift, which is expected — `npm run check` only requires they stay parseable and renderable.
- `src/lib/gallery.ts` — still the source of the **generators**: `CATEGORIES`, `projectSlug`, `projectImages` (deterministic mixed-size gallery fallback when a project has no hand-picked gallery), `projectDescription`, `projectScope`, `projectYear`, `getMoreProjects`. `defaults.ts` derives its seed data from `galleryItems` here; the admin-authored `ProjectData` rows in Supabase are what actually render once the client has edited a project.
- `src/lib/journal.ts` — journal/blog data (routes disabled, see above): `JournalPost`s with a typed `body` block list, `posts`, `getPost(slug)`, `getNextPost(slug)`, `headingId(text)`.
- `src/lib/lenis.ts` — module-singleton handle to the document's Lenis instance. `SmoothScroll` registers it via `setLenis`; any client component reads it with `getLenis`/`scrollToId` to drive programmatic smooth scroll that cooperates with Lenis instead of fighting it via native `scrollIntoView`.

`src/lib/projects.ts` is **deleted** — its case-study data is superseded by `content.ts` + `defaults.ts`, and its slugs live on in `gallery.ts`.

### Projects index (`/projects`)
A filterable column-masonry — referenced from formedgardens.com.au/projects. `ProjectGallery` (client) renders the filter chips + a CSS `columns-2 sm:columns-3` masonry (size variants `sm`/`wide`/`tall`/`lg` → `aspect-*`; `break-inside-avoid`). Changing a filter remounts the grid via a React `key`, replaying the staggered `.gallery-enter` entrance. Tiles are `next/image` `fill` (responsive `sizes`, first 4 `priority`, rest lazy) wrapped in a `<Link>` to `/projects/[slug]`; the name reveals over a bottom gradient on hover (`.gallery-tile`/`.gallery-cap`/`.gallery-scrim`, always visible on touch).

### Project detail (`/projects/[slug]`)
`generateStaticParams` over every gallery item. Structure mirrors formedgardens.com.au/project/*: full-bleed `ParallaxImage` hero (with a back link) → info section (category eyebrow, `SplitText` title, 2-paragraph description, and a Location/Completed/Scope-of-work details table beside a feature image) → mixed-size gallery (`projectImages`, full-width + half tiles via `ParallaxImage`) → "More projects" (3 next items as hover-caption tiles). All copy/images for items without a `summary` are generated — replace with real content.

## Admin

Route map, all under `(admin)/admin/`:

| Route | Renders |
| --- | --- |
| `/admin` | Dashboard — four cards linking to the sections below |
| `/admin/login` | Email/password sign-in (Supabase Auth), no self-service reset |
| `/admin/homepage` | Tabs: **Hero**, **What we do** (disciplines), **Featured** (mosaic), **Workshop** |
| `/admin/services` | Tabs: **Photos** (the two hero images), **Wording** (the services-page headings and lede) |
| `/admin/settings` | Site details — the licence number shown in the footer once set |
| `/admin/projects` | List — add, reorder, publish/hide, delete |
| `/admin/projects/[id]` | One project's editor (fields, cover/feature images, gallery) |
| `/admin/media` | Library — upload, rename, set alt text, delete |

Server actions live in `(admin)/admin/_actions/{auth,content,media,projects}.ts`, each `"use server"`. **Every exported action calls `requireSession()` (`src/lib/auth.ts`) itself** — a Server Action is a public HTTP endpoint reachable directly, without ever passing through `middleware.ts`, so the middleware redirect (see Routing above) is a UX nicety, not the authorisation boundary. `requireSession()` calls `supabase.auth.getUser()`, not `getSession()` — the latter trusts the cookie without checking it against the auth server.

Content saves (`saveContent`) and project mutations both re-validate against `schemas.ts` server-side (the browser's `zodResolver` is a convenience for the client, not a trust boundary), then call `updateTag()` to purge the affected public page — see the Gotchas note below.

Uploads (`src/lib/upload.ts`) go straight from the browser to Supabase Storage: images are downscaled (longest edge 2400px) and re-encoded to WebP client-side before the PUT; video is capped client-side at 25MB and only `video/mp4` is accepted. Both are conveniences — the Storage bucket's own `allowed_mime_types`/`file_size_limit` are the real, server-side control. Deleting a media row is refused if `src/lib/media.ts`'s `findReferences()` finds it used anywhere (hero, disciplines, mosaic, workshop, services hero, or any project's cover/feature/gallery); the refusal names every place, and a `source: "repo"` row (shipped with the build) can't be deleted at all.

`SUPABASE_SERVICE_ROLE_KEY` is read in exactly one place, `scripts/seed.mjs` — nothing under `src/` may import it. The deployed app authorises purely through the signed-in user's own session and Postgres RLS.

## Deploy

`npm run deploy` runs `opennextjs-cloudflare build && opennextjs-cloudflare deploy`, shipping to Cloudflare Workers. `open-next.config.ts` wires two Cloudflare bindings, declared in `wrangler.jsonc`:
- `NEXT_INC_CACHE_KV` — the incremental (ISR) cache, and doubles as the store for the login throttle (`src/lib/ratelimit.ts`).
- `NEXT_TAG_CACHE_D1` — the tag cache. **Instant publish depends on this**: `updateTag()` only purges a cached public page if the D1-backed tag cache is present and reachable: without it, an admin save would not invalidate the public page. `wrangler.jsonc`'s `REPLACE_IN_TASK_2` placeholders must be real KV/D1 IDs before the first deploy.

`npm run preview` runs the same OpenNext build against a local Workers runtime, for a truer test than `next dev`. `npm run cf-typegen` regenerates `cloudflare-env.d.ts` from the bindings above.

### Motion components (every interactive piece is `"use client"`)

**System primitives** — used everywhere
- `SmoothScroll` — Lenis init; honors `prefers-reduced-motion` by skipping; delegates RAF to `gsap.ticker`.
- `Cursor` — 8px dot tracking real-time + 36px lerped trailing ring with `mix-blend-mode: difference`. Ring scales 1.8× over anchors / buttons / any `[data-cursor="hover"]`. Hidden on touch + reduced-motion.
- `Loader` — masked-text reveal of `BM.` (each letter rises through its own clip), then a `clip-path` curtain wipes upward at ~1.8s, component unmounts at 2.75s.

**Entrance / reveal**
- `Reveal` — IntersectionObserver fade-up; callback-ref so it complies with React 19's `react-hooks/refs` rule.
- `SplitText` — splits children into `.split-word` → `.split-char` spans; per-char `translateY(110%)` → 0 with CSS-var stagger.
- `MaskHeading` — line-by-line mask reveal where each line slides up through its own `overflow:hidden` clip with delay stagger.
- `RevealImage` — clip-path/scale image reveal on scroll-in (image-specific counterpart to `Reveal`).
- `CountUp` — counts `0→to` once on first scroll-into-view via a single eased rAF loop; snaps to the final value under reduced-motion. Used for stat blocks.

**Pointer-driven**
- `MagneticLink` — Next `<Link>` with cursor-magnetic inner span (default strength 0.18); pointer position written to CSS vars via `requestAnimationFrame` (no React re-render).
- `ProjectTile` — image link with 96px circular `cursor-pill` that follows the pointer inside the tile; `cursor: none` while hovering; falls back to default on `(hover: none)`.
- `HoverFillButton` — directional hover-fill; bg slides in from whichever edge the pointer crossed and exits the opposite way.

**Scroll choreography (GSAP)**
- `ParallaxImage` — scrub-tied translateY + scale-to-1 on the image; uses `gsap.context()` for clean unmount.
- `PinnedHero` — pinned full-bleed image + scaling on scrolldown; content fades / translates as the hero exits.
- `StickyStack` — N panels each `position: sticky` with stepped `top` offsets; lower panels scale down + fade as the next one slides over.
- `HorizontalGallery` — pins a section and translates an inner rail by its overflow width on scroll; gracefully falls back to native horizontal scroll on touch / reduced-motion.
- `MarqueeBand` — continuous translateX loop driven by RAF; scroll velocity feeds extra speed + a small skewX for kinetic feel; auto-decays via lerp.
- `ReadingProgress` — fixed top progress bar tracking scroll through a target element (`targetId`); used on journal articles.
- `ArticleRail` — sticky chapter rail for long-form articles; IntersectionObserver scroll-spy over `<h>` anchors (ids from `headingId`), click-to-scroll via `scrollToId` (Lenis singleton). Hidden on small viewports.

**Layout/structural**
- `BrandMark` — renders `BM.` with the period in its own span for the hover-lift animation.
- `SiteNav` — sliding underline indicator (measures link rects in `useLayoutEffect`, animates a single absolute span via CSS vars), morph hamburger, masked overlay menu, body-scroll lock, ESC to close, auto-close on route change.
- `SiteFooter` — Server Component; pure markup; footer-list links translate-right on hover; `<BrandMark>` next to copyright.

### Styling
- Tailwind v4 utilities + design tokens (oklch palette) in `globals.css` `:root`.
- Motion tokens alongside the palette: `--ease-out-expo`, `--ease-out-quart`, `--ease-spring`, `--ease-vercel`, `--dur-fast/med/slow`. Never use linear easing; pick a token.
- Motion-system classes under `@layer utilities`: `.loader-mask/.loader-curtain`, `.split-text/.split-word/.split-char`, `.mask-line`, `.magnetic/.magnetic-inner`, `.fill-btn/.fill-bg/.fill-label`, `.nav-track/.nav-indicator/.nav-link`, `.hamburger`, `.menu-mask`, `.cursor-stage/.cursor-pill`, `.cursor-dot/.cursor-ring`, `.field-line`, `.arrow-link`, `.parallax-stage/.parallax-target`, `.stack-card`, `.h-rail/.h-tile`, `.kinetic-track`, `.brand-mark`, `.service-row` (zig-zag), `.divider-line`, `.marquee` (legacy CSS marquee — still used by the old marquee section).
- `prefers-reduced-motion` honored globally in `@layer base` (collapses all motion to ~0).
- `globals.css` starts with `@import "tailwindcss";` and that must stay first. Hanken Grotesk is self-hosted through `next/font` in `layout.tsx` — there is no Google Fonts `@import` any more.

### Motion philosophy
Subtle, physical, never linear. All animations target `transform` and `opacity` only. High-frequency pointer interactions (magnetic, cursor pill, custom cursor) write to CSS custom properties from `requestAnimationFrame` so React never re-renders during motion. Long-form entrance reveals are driven by `IntersectionObserver` + class toggles; complex scroll choreography (pinning, scrub, parallax) is delegated to GSAP through `gsap.context()` with `revert()` cleanup. Lenis drives the document's smooth-scroll and feeds ScrollTrigger via `gsap.ticker`.

### Next 16 specifics
- `next lint` removed — `package.json` runs `eslint .` directly.
- `eslint-config-next@16` ships flat configs natively; don't wrap with `FlatCompat`.
- `next.config.ts` sets `turbopack.root` to silence the multi-lockfile workspace-root warning.
- Vendored shadcn/ui files + `use-mobile.tsx` have the new React 19 `react-hooks/{set-state-in-effect,refs,purity}` rules disabled in `eslint.config.mjs` — upstream shadcn templates trip them.

### Gotchas
- **Relative imports inside `src/lib/` carry an explicit `.ts` extension** (e.g. `import type { GalleryItem } from "./gallery.ts"` in `defaults.ts`/`content.ts`/`media.ts`) — `tsconfig.json` sets `allowImportingTsExtensions: true` for exactly this. It matters beyond style: `scripts/seed.mjs` and the `tests/` suite load these `src/lib/` modules directly via Node, with no bundler in front, and Node's own ESM resolver requires the extension on relative specifiers. Match the pattern in any new `src/lib/` file.
- **Use `updateTag`, not `revalidateTag`.** Next 16.3.4 made `revalidateTag`'s second argument (a cache-life profile, for Cache Components' `"use cache"` entries) mandatory, which doesn't fit a Server Action that just wants a tag gone before it returns. `_actions/content.ts` and `_actions/projects.ts` call `updateTag(tag)` from `next/cache` instead — it's what Next's own docs point to for this case. (`_actions/media.ts` has no public page to purge, so it uses plain `revalidatePath("/admin/media")`.)

## Project origin

Migrated from a TanStack Start + Vite + Cloudflare Workers + Lovable scaffold to Next.js 16, then rebuilt for BM Carpentry & Landscaping with an Awwwards-targeted motion architecture (Lenis + GSAP). Design language: warm naturalistic oklch palette, editorial layout, image-led storytelling. Type system follows formedgardens.com.au — a single clean grotesque, **Hanken Grotesk**, used for both display and body (`--font-display` and `--font-sans` both point at it). Display type runs light/medium weight (400–500) with tight tracking (~-0.025em); the `.font-display` utility and base `h*` tags share that weight/tracking so headings read consistently whether on an `h*` tag or a `<p>`/`<span>`. Headings stay restrained in scale — quiet negative space and the photography carry the page (no oversized hero type). (Earlier iterations used Fraunces serif / Cormorant Garamond / Inter Tight display — all replaced by the unified Hanken Grotesk grotesque.)
