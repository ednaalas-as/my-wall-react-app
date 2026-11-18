-- =============================================================================
-- Profile photos for registered users.
--
-- * Photos live in the public Storage bucket `avatars`, under a folder named
--   after the user's id: avatars/<user id>/<file>.
-- * profiles.avatar_path stores the object path. A check constraint only
--   allows paths inside the user's own folder, so a profile can never point
--   at another user's file or an external URL.
-- * Each post keeps a snapshot of the author's photo path at publish time,
--   just like author_name: changing your photo affects future posts only.
-- * Guests have no account, so they cannot upload photos.
-- =============================================================================

alter table public.profiles
  add column if not exists avatar_path text;

alter table public.profiles
  drop constraint if exists profiles_avatar_path_own_folder;
alter table public.profiles
  add constraint profiles_avatar_path_own_folder
  check (
    avatar_path is null
    or (avatar_path like id::text || '/%' and char_length(avatar_path) <= 200)
  );

alter table public.posts
  add column if not exists author_avatar_path text;

-- Members can change their display name and photo, nothing else.
grant update (display_name, avatar_path) on public.profiles to authenticated;

-- -----------------------------------------------------------------------------
-- Snapshot the member's photo onto each new post (guests: none).
-- -----------------------------------------------------------------------------

create or replace function public.normalize_post()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  profile_name   text;
  profile_avatar text;
begin
  new.message    := btrim(new.message);
  new.created_at := now();

  if new.user_id is not null then
    select p.display_name, p.avatar_path
      into profile_name, profile_avatar
      from public.profiles p
     where p.id = new.user_id;

    new.author_name        := coalesce(profile_name, 'Member');
    new.author_avatar_path := profile_avatar;
  else
    new.author_name        := coalesce(nullif(btrim(new.author_name), ''), 'Guest');
    new.author_avatar_path := null;
  end if;

  return new;
end;
$$;

revoke execute on function public.normalize_post() from public, anon, authenticated;

-- -----------------------------------------------------------------------------
-- Storage bucket: public read, images only, 2 MB max.
-- -----------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars',
  'avatars',
  true,
  2097152,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update
  set public             = excluded.public,
      file_size_limit    = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Members may upload only into their own folder. Files are never overwritten
-- or deleted from the app (each new photo gets a new name), so old posts keep
-- showing the photo they were published with. Public URLs need no SELECT
-- policy, which also keeps the bucket from being listed.
drop policy if exists "Members upload their own avatar" on storage.objects;
create policy "Members upload their own avatar"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
