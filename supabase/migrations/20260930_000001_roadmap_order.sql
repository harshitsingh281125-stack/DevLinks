-- Roadmap collections: an author-defined order for the links in a collection.
--
-- collections.is_roadmap  when true, the collection is shown as numbered steps
--                         (dashboard + public page) in bookmarks.position order.
-- bookmarks.position      1-based order within its collection. Always set: the
--                         trigger below appends new links (and links moved in
--                         from another collection) to the end.
-- reorder_bookmarks(...)  rewrites a collection's order in one statement.

alter table public.collections
  add column if not exists is_roadmap boolean not null default false;

alter table public.bookmarks
  add column if not exists position integer;

-- Backfill: existing links keep the order they were saved in (oldest first,
-- which is how a study path usually grows).
update public.bookmarks b
set position = ordered.rn
from (
  select id, row_number() over (partition by collection_id order by created_at, id) as rn
  from public.bookmarks
) ordered
where ordered.id = b.id
  and b.position is null;

alter table public.bookmarks
  alter column position set not null;

create index if not exists bookmarks_collection_position_idx
  on public.bookmarks (collection_id, position);

-- ─── Append on insert / move ─────────────────────────────────────────────────

create or replace function public.assign_bookmark_position()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'INSERT' and new.position is not null then
    return new;
  end if;

  if tg_op = 'INSERT' or new.collection_id is distinct from old.collection_id then
    select coalesce(max(position), 0) + 1
    into new.position
    from public.bookmarks
    where collection_id = new.collection_id
      and id <> new.id;
  end if;

  return new;
end;
$$;

drop trigger if exists bookmarks_assign_position on public.bookmarks;
create trigger bookmarks_assign_position
before insert or update of collection_id on public.bookmarks
for each row
execute function public.assign_bookmark_position();

-- ─── Reorder ─────────────────────────────────────────────────────────────────
-- security invoker: runs as the caller, so bookmarks_update_own (RLS) still
-- decides which rows can change. The id list must be exactly the collection's
-- bookmarks, so a stale client can't leave gaps or duplicates.

create or replace function public.reorder_bookmarks(p_collection_id uuid, p_bookmark_ids uuid[])
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  expected integer;
begin
  select count(*) into expected
  from public.bookmarks
  where collection_id = p_collection_id
    and user_id = auth.uid();

  if expected <> coalesce(array_length(p_bookmark_ids, 1), 0)
     or expected <> (select count(distinct x) from unnest(p_bookmark_ids) as x) then
    raise exception 'Order is out of date. Reload and try again.'
      using errcode = '22023';
  end if;

  if exists (
    select 1
    from unnest(p_bookmark_ids) as x(id)
    where not exists (
      select 1 from public.bookmarks b
      where b.id = x.id
        and b.collection_id = p_collection_id
        and b.user_id = auth.uid()
    )
  ) then
    raise exception 'Order is out of date. Reload and try again.'
      using errcode = '22023';
  end if;

  update public.bookmarks b
  set position = ids.ord
  from unnest(p_bookmark_ids) with ordinality as ids(id, ord)
  where b.id = ids.id
    and b.collection_id = p_collection_id
    and b.user_id = auth.uid();
end;
$$;

revoke all on function public.reorder_bookmarks(uuid, uuid[]) from public, anon;
grant execute on function public.reorder_bookmarks(uuid, uuid[]) to authenticated;
