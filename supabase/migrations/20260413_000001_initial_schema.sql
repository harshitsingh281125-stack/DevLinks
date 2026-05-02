create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  github_username text,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint profiles_github_username_key unique (github_username)
);

create table if not exists public.collections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  description text,
  slug text,
  is_public boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint collections_slug_key unique (slug),
  constraint collections_name_not_blank check (btrim(name) <> '')
);

create table if not exists public.bookmarks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  collection_id uuid not null references public.collections (id) on delete restrict,
  title text not null,
  url text not null,
  normalized_url text not null,
  description text,
  domain text,
  favicon_url text,
  image_url text,
  resource_type text,
  tags text[] not null default '{}',
  search_text text not null default '',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint bookmarks_user_id_normalized_url_key unique (user_id, normalized_url),
  constraint bookmarks_title_not_blank check (btrim(title) <> ''),
  constraint bookmarks_url_not_blank check (btrim(url) <> ''),
  constraint bookmarks_normalized_url_not_blank check (btrim(normalized_url) <> '')
);
