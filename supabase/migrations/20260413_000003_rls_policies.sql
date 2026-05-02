alter table public.profiles enable row level security;
alter table public.collections enable row level security;
alter table public.bookmarks enable row level security;

alter table public.profiles force row level security;
alter table public.collections force row level security;
alter table public.bookmarks force row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
on public.profiles
for select
to authenticated
using (auth.uid() = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
on public.profiles
for insert
to authenticated
with check (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
on public.profiles
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

drop policy if exists "profiles_delete_own" on public.profiles;
create policy "profiles_delete_own"
on public.profiles
for delete
to authenticated
using (auth.uid() = id);

drop policy if exists "collections_select_own_or_public" on public.collections;
create policy "collections_select_own_or_public"
on public.collections
for select
to authenticated, anon
using (auth.uid() = user_id or is_public = true);

drop policy if exists "collections_insert_own" on public.collections;
create policy "collections_insert_own"
on public.collections
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "collections_update_own" on public.collections;
create policy "collections_update_own"
on public.collections
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "collections_delete_own" on public.collections;
create policy "collections_delete_own"
on public.collections
for delete
to authenticated
using (auth.uid() = user_id);

drop policy if exists "bookmarks_select_own_or_public_collection" on public.bookmarks;
create policy "bookmarks_select_own_or_public_collection"
on public.bookmarks
for select
to authenticated, anon
using (
  auth.uid() = user_id
  or exists (
    select 1
    from public.collections
    where collections.id = bookmarks.collection_id
      and collections.user_id = bookmarks.user_id
      and collections.is_public = true
  )
);

drop policy if exists "bookmarks_insert_own" on public.bookmarks;
create policy "bookmarks_insert_own"
on public.bookmarks
for insert
to authenticated
with check (
  auth.uid() = user_id
  and exists (
    select 1
    from public.collections
    where collections.id = bookmarks.collection_id
      and collections.user_id = auth.uid()
  )
);

drop policy if exists "bookmarks_update_own" on public.bookmarks;
create policy "bookmarks_update_own"
on public.bookmarks
for update
to authenticated
using (auth.uid() = user_id)
with check (
  auth.uid() = user_id
  and exists (
    select 1
    from public.collections
    where collections.id = bookmarks.collection_id
      and collections.user_id = auth.uid()
  )
);

drop policy if exists "bookmarks_delete_own" on public.bookmarks;
create policy "bookmarks_delete_own"
on public.bookmarks
for delete
to authenticated
using (auth.uid() = user_id);
