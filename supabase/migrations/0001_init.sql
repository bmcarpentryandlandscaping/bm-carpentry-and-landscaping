-- BM Carpentry admin CMS — initial schema.
-- Idempotent: safe to run more than once.

-- ── media library ───────────────────────────────────────────────────────
create table if not exists media (
  id         uuid primary key default gen_random_uuid(),
  url        text not null unique,      -- '/images/x.webp' (repo) or a Storage public URL
  name       text not null,             -- client-editable display name
  alt        text not null default '',
  source     text not null default 'upload' check (source in ('repo','upload')),
  kind       text not null default 'image' check (kind in ('image','video')),
  width      int, height int, bytes int,
  created_at timestamptz not null default now()
);

-- ── keyed singleton sections ────────────────────────────────────────────
create table if not exists content (
  key        text primary key,          -- 'home.hero' | 'disciplines' | 'home.mosaic'
                                        -- | 'home.workshop' | 'services.hero'
  data       jsonb not null,
  updated_at timestamptz not null default now()
);

-- ── projects ────────────────────────────────────────────────────────────
create table if not exists projects (
  id         uuid primary key default gen_random_uuid(),
  slug       text not null unique,
  position   int  not null default 0,
  published  boolean not null default true,
  data       jsonb not null,
  updated_at timestamptz not null default now()
);
create index if not exists projects_order on projects (published, position);

-- ── RLS: anon reads, authenticated writes ───────────────────────────────
alter table media    enable row level security;
alter table content  enable row level security;
alter table projects enable row level security;

do $$
declare t text;
begin
  foreach t in array array['media','content','projects'] loop
    execute format('drop policy if exists "public read" on %I', t);
    execute format('drop policy if exists "auth write"  on %I', t);
    execute format(
      'create policy "auth write" on %I for all to authenticated using (true) with check (true)', t);
  end loop;
end $$;

-- content is wholly public — it IS the site's published content.
create policy "public read" on content for select to anon, authenticated using (true);

-- media is NOT read by any public page (src/lib/content.ts only queries
-- `content` and `projects`) — it backs the admin's media library only. The
-- anon key ships to every browser, so `to anon` here would let anyone
-- enumerate every uploaded filename and alt text, including files never
-- placed on the site. Authenticated only; the admin reads it through the
-- user's own session, and scripts/seed.mjs writes it with the service-role
-- key, which bypasses RLS entirely.
create policy "public read" on media for select to authenticated using (true);

-- projects is the exception. The anon key ships to every browser, so
-- `using (true)` would let anyone read unpublished drafts directly from
-- PostgREST, even though every read path in the app filters on published.
-- `published` is real visibility, not a display filter. The "auth write"
-- policy above is `for all`, which already covers SELECT, so a signed-in
-- admin still sees drafts.
create policy "public read" on projects for select to anon using (published);

-- ── storage bucket, with SERVER-SIDE limits (spec §4, §6.2) ─────────────
-- The browser pipeline in src/lib/upload.ts is a convenience. A valid session
-- can PUT straight at Storage and skip it. Only these two columns are unbypassable.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'media', 'media', true,
  26214400,                                   -- 25MB, the video ceiling
  array['image/webp','image/jpeg','image/png','video/mp4']
)
on conflict (id) do update set
  public             = excluded.public,
  file_size_limit    = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "media public read" on storage.objects;
drop policy if exists "media auth insert" on storage.objects;
drop policy if exists "media auth update" on storage.objects;
drop policy if exists "media auth delete" on storage.objects;

create policy "media public read" on storage.objects
  for select to anon, authenticated using (bucket_id = 'media');
create policy "media auth insert" on storage.objects
  for insert to authenticated with check (bucket_id = 'media');
create policy "media auth update" on storage.objects
  for update to authenticated using (bucket_id = 'media');
create policy "media auth delete" on storage.objects
  for delete to authenticated using (bucket_id = 'media');
