import { getSupabaseEnv } from "@/lib/supabase/env";

export const AVATAR_BUCKET = "avatars";
export const AVATAR_MAX_BYTES = 2 * 1024 * 1024;
export const AVATAR_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

export const DEFAULT_PROFILE_PHOTO = "/profile-placeholder.svg";

/** Public URL for a stored photo path ("<user id>/<file>"), or null. */
export function avatarUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  const { url } = getSupabaseEnv();
  const encoded = path.split("/").map(encodeURIComponent).join("/");
  return `${url}/storage/v1/object/public/${AVATAR_BUCKET}/${encoded}`;
}

/** Returns an error message, or null when the file can be uploaded. */
export function validateAvatar(file: File): string | null {
  if (!(file.type in AVATAR_TYPES)) return "Please choose a JPG, PNG, WebP or GIF image.";
  if (file.size > AVATAR_MAX_BYTES) return "Please choose an image under 2 MB.";
  return null;
}
