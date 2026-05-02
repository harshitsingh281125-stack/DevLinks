create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create or replace function public.normalize_bookmark_url(input_url text)
returns text
language sql
immutable
as $$
  select nullif(
    regexp_replace(
      regexp_replace(
        regexp_replace(
          regexp_replace(lower(btrim(coalesce(input_url, ''))), '^https?://', ''),
          '^www\d*\.',
          ''
        ),
        '[#?].*$',
        ''
      ),
      '/+$',
      ''
    ),
    ''
  );
$$;

create or replace function public.build_bookmark_search_text(
  bookmark_title text,
  bookmark_url text,
  bookmark_normalized_url text,
  bookmark_description text,
  bookmark_domain text,
  bookmark_tags text[],
  bookmark_resource_type text
)
returns text
language sql
immutable
as $$
  select lower(
    concat_ws(
      ' ',
      coalesce(bookmark_title, ''),
      coalesce(bookmark_url, ''),
      coalesce(bookmark_normalized_url, ''),
      coalesce(bookmark_description, ''),
      coalesce(bookmark_domain, ''),
      array_to_string(coalesce(bookmark_tags, '{}'::text[]), ' '),
      coalesce(bookmark_resource_type, '')
    )
  );
$$;

create or replace function public.sync_bookmark_derived_fields()
returns trigger
language plpgsql
as $$
begin
  new.normalized_url = public.normalize_bookmark_url(new.url);
  new.search_text = public.build_bookmark_search_text(
    new.title,
    new.url,
    new.normalized_url,
    new.description,
    new.domain,
    new.tags,
    new.resource_type
  );

  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();

drop trigger if exists collections_set_updated_at on public.collections;
create trigger collections_set_updated_at
before update on public.collections
for each row
execute function public.set_updated_at();

drop trigger if exists bookmarks_set_updated_at on public.bookmarks;
create trigger bookmarks_set_updated_at
before update on public.bookmarks
for each row
execute function public.set_updated_at();

drop trigger if exists bookmarks_sync_derived_fields on public.bookmarks;
create trigger bookmarks_sync_derived_fields
before insert or update on public.bookmarks
for each row
execute function public.sync_bookmark_derived_fields();

update public.bookmarks
set url = url
where true;

-- These lookup indexes are already present via the unique constraints created in
-- the initial schema migration:
--   collections_slug_key
--   bookmarks_user_id_normalized_url_key
create index if not exists bookmarks_search_text_fts_idx
on public.bookmarks
using gin (to_tsvector('simple', coalesce(search_text, '')));
