import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Post } from "@/types/database";

export const MAX_MESSAGE_LENGTH = 280;
export const MAX_NAME_LENGTH = 40;
export const FEED_LIMIT = 50;
export const POST_COLUMNS = "id, user_id, author_name, author_avatar_path, message, created_at";

/** Returns an error message, or null when the message can be posted. */
export function validateMessage(message: string): string | null {
  if (message.trim().length === 0) return "Write something before sharing.";
  if (message.length > MAX_MESSAGE_LENGTH) {
    return `Posts can be at most ${MAX_MESSAGE_LENGTH} characters.`;
  }
  return null;
}

/** Latest posts, newest first. Pass userId to get one member's posts. */
export async function fetchPosts(
  supabase: SupabaseClient<Database>,
  userId?: string,
) {
  let query = supabase
    .from("posts")
    .select(POST_COLUMNS)
    .order("created_at", { ascending: false })
    .limit(FEED_LIMIT);

  if (userId) query = query.eq("user_id", userId);

  return query;
}

/** Merges posts by id (no duplicates), newest first, capped at the feed limit. */
export function mergePosts(current: Post[], incoming: Post[]): Post[] {
  const byId = new Map<string, Post>();
  for (const post of [...incoming, ...current]) {
    if (!byId.has(post.id)) byId.set(post.id, post);
  }
  return [...byId.values()]
    .sort(
      (a, b) =>
        Date.parse(b.created_at) - Date.parse(a.created_at) ||
        b.id.localeCompare(a.id),
    )
    .slice(0, FEED_LIMIT);
}
