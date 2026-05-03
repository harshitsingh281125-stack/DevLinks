-- ─── New profile fields ────────────────────────────────────────────────────────
alter table public.profiles
  add column if not exists bio            text,
  add column if not exists location       text,
  add column if not exists website_url    text,
  add column if not exists twitter_handle text,
  add column if not exists linkedin_url   text;

-- ─── Avatars storage bucket ────────────────────────────────────────────────────
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars',
  'avatars',
  true,
  2097152,  -- 2 MB
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do nothing;

-- Users can upload/replace/delete only their own avatar (path must start with their user id).
drop policy if exists "avatars_insert_own" on storage.objects;
create policy "avatars_insert_own"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "avatars_update_own" on storage.objects;
create policy "avatars_update_own"
on storage.objects for update
to authenticated
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "avatars_delete_own" on storage.objects;
create policy "avatars_delete_own"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- Anyone (anon included) can read avatars because the bucket is public.
drop policy if exists "avatars_select_public" on storage.objects;
create policy "avatars_select_public"
on storage.objects for select
to anon, authenticated
using (bucket_id = 'avatars');

-- ─── Public profile read for collection authors ────────────────────────────────
-- Visitors of a public collection page need to read the author's profile.
-- We only expose a row when the owner has at least one public collection.
drop policy if exists "profiles_select_public_author" on public.profiles;
create policy "profiles_select_public_author"
on public.profiles
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.collections c
    where c.user_id = profiles.id
      and c.is_public = true
  )
);
