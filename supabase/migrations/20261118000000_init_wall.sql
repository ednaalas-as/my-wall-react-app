-- =============================================================================
-- My Wall — initial schema
--
-- Run this whole file once in the Supabase dashboard:
--   SQL Editor → New query → paste → Run
-- It is safe to re-run: every object is created with IF NOT EXISTS or is
-- dropped and recreated.
--
-- Model
--   * profiles: one row per registered user (display name only).
--   * posts:    every wall post. Guest posts have user_id = NULL, member posts
--               have user_id = auth.uid() of the author.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Tables
-- -----------------------------------------------------------------------------

create table if not exists public.profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  display_name text not null
               check (char_length(btrim(display_name)) between 1 and 40),
  created_at   timestamptz not null default now()
);

comment on table public.profiles is
  'Public-facing name for each registered user. Readable only by its owner.';

create table if not exists public.posts (
  id          uuid primary key default gen_random_uuid(),
  -- NULL = guest post. If the account is deleted the post stays on the wall
  -- and becomes an anonymous post.
  user_id     uuid references auth.users (id) on delete set null,
  author_name text not null default 'Guest'
              check (char_length(btrim(author_name)) between 1 and 40),
  message     text not null
              check (char_length(btrim(message)) between 1 and 280),
  created_at  timestamptz not null default now()
);

comment on table public.posts is
  'Wall posts. user_id is NULL for guests and auth.uid() for members.';

-- Wall feed: newest first.
create index if not exists posts_created_at_idx
  on public.posts (created_at desc);

-- "My Posts": one user's posts, newest first.
create index if not exists posts_user_id_created_at_idx
  on public.posts (user_id, created_at desc)
  where user_id is not null;

-- -----------------------------------------------------------------------------
-- Post normalisation trigger
--
-- Runs before every insert. The server, not the browser, decides:
--   * the timestamp (no back-dating or future-dating posts),
--   * the author name for members (taken from their profile, so a member
--     cannot post under someone else's name),
--   * a trimmed guest name, defaulting to 'Guest'.
-- -----------------------------------------------------------------------------

create or replace function public.normalize_post()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  profile_name text;
begin
  new.message    := btrim(new.message);
  new.created_at := now();

  if new.user_id is not null then
    select p.display_name
      into profile_name
      from public.profiles p
     where p.id = new.user_id;

    new.author_name := coalesce(profile_name, 'Member');
  else
    new.author_name := coalesce(nullif(btrim(new.author_name), ''), 'Guest');
  end if;

  return new;
end;
$$;

drop trigger if exists posts_normalize on public.posts;
create trigger posts_normalize
  before insert on public.posts
  for each row execute function public.normalize_post();

-- -----------------------------------------------------------------------------
-- Profile creation on sign-up
--
-- The display name comes from the sign-up form
-- (supabase.auth.signUp({ options: { data: { display_name } } })).
-- Falls back to the part of the email before the "@".
-- -----------------------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  requested_name text;
begin
  requested_name := btrim(coalesce(new.raw_user_meta_data ->> 'display_name', ''));

  if requested_name = '' then
    requested_name := split_part(coalesce(new.email, 'Member'), '@', 1);
  end if;

  insert into public.profiles (id, display_name)
  values (new.id, left(requested_name, 40))
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- -----------------------------------------------------------------------------
-- Privileges
--
-- Grant exactly what the app needs. UPDATE and DELETE on posts are never
-- granted to the browser roles, so posts cannot be edited or removed from the
-- client even if a policy were added by mistake.
-- -----------------------------------------------------------------------------

revoke all on public.posts    from anon, authenticated;
revoke all on public.profiles from anon, authenticated;

grant select, insert on public.posts to anon, authenticated;
grant select, update (display_name) on public.profiles to authenticated;

-- -----------------------------------------------------------------------------
-- Row Level Security
-- -----------------------------------------------------------------------------

alter table public.posts    enable row level security;
alter table public.profiles enable row level security;

-- posts: everyone can read the public wall.
drop policy if exists "Wall is readable by everyone" on public.posts;
create policy "Wall is readable by everyone"
  on public.posts for select
  to anon, authenticated
  using (true);

-- posts: visitors who are not logged in can only create guest posts.
drop policy if exists "Guests can post anonymously" on public.posts;
create policy "Guests can post anonymously"
  on public.posts for insert
  to anon
  with check (user_id is null);

-- posts: logged-in users can only post as themselves.
drop policy if exists "Members post as themselves" on public.posts;
create policy "Members post as themselves"
  on public.posts for insert
  to authenticated
  with check (user_id = (select auth.uid()));

-- No UPDATE / DELETE policies on posts: with RLS enabled, that denies both.

-- profiles: a user can read and rename only their own profile.
drop policy if exists "Users read their own profile" on public.profiles;
create policy "Users read their own profile"
  on public.profiles for select
  to authenticated
  using (id = (select auth.uid()));

drop policy if exists "Users update their own profile" on public.profiles;
create policy "Users update their own profile"
  on public.profiles for update
  to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- -----------------------------------------------------------------------------
-- Realtime: broadcast new posts to every open wall.
-- -----------------------------------------------------------------------------

do $$
begin
  if not exists (
    select 1
      from pg_publication_tables
     where pubname = 'supabase_realtime'
       and schemaname = 'public'
       and tablename = 'posts'
  ) then
    alter publication supabase_realtime add table public.posts;
  end if;
end;
$$;
