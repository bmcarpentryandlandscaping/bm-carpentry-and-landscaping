# Supabase setup — run once

1. **Create the project** at https://supabase.com/dashboard (region: Sydney,
   `ap-southeast-2` — it is where the visitors are).
2. **Run the migration.** SQL Editor → New query → paste all of
   `supabase/migrations/0001_init.sql` → Run. It is idempotent; re-running after a
   mistake is safe.
3. **Verify it took.** Check the security model, not just the table names — a
   half-applied run leaves a database that looks right and is publicly writable.
   ```sql
   select tablename from pg_tables where schemaname = 'public';
   -- expect: media, content, projects

   -- RLS must be ON for all three. `false` anywhere here means the table is wide open.
   select relname, relrowsecurity from pg_class
   where relname in ('media','content','projects');
   -- expect: all three true

   -- Expect 6: one "public read" and one "auth write" per table.
   select tablename, policyname, roles, cmd from pg_policies
   where schemaname = 'public' order by tablename, policyname;
   -- projects' "public read" must read `(published)`, NOT `true`

   -- Storage RLS must also be on, and the four media policies present.
   select relrowsecurity from pg_class where relname = 'objects';
   -- expect: true
   select policyname from pg_policies where tablename = 'objects';
   -- expect the four "media ..." policies

   select id, file_size_limit, allowed_mime_types from storage.buckets where id = 'media';
   -- expect: media | 26214400 | {image/webp,image/jpeg,image/png,video/mp4}
   ```
4. **Turn off public signup.** Authentication → Sign In / Providers → Email →
   **disable "Allow new users to sign up"**. This site has exactly one account and
   no signup route; leaving it on means anyone can create an authenticated user,
   and the RLS write policy trusts `authenticated`.
5. **Create the client's user.** Authentication → Users → Add user → email +
   a generated password, **Auto Confirm User** on. Send the password out of band.
6. **Copy the keys** into `.env.local` (Project Settings → API):
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
   SUPABASE_SERVICE_ROLE_KEY=eyJ...
   ```
   `.env*` is already gitignored. The service-role key never leaves this machine —
   it is not set as a Cloudflare secret and nothing under `src/` may read it.
