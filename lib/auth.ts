import "server-only";
import { cache } from "react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { avatarUrl } from "@/lib/avatars";
import type { CurrentUser } from "@/types/database";

/**
 * Returns the signed-in user, or null for guests and expired sessions.
 * getClaims() verifies the JWT, so the id can be trusted on the server.
 * Cached per request so the layout and page share one lookup.
 */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims?.sub) return null;

  const userId = data.claims.sub;
  const email = typeof data.claims.email === "string" ? data.claims.email : null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, avatar_path, created_at")
    .eq("id", userId)
    .maybeSingle();

  return {
    id: userId,
    email,
    displayName: profile?.display_name ?? email?.split("@")[0] ?? "Member",
    avatarUrl: avatarUrl(profile?.avatar_path),
    memberSince: profile?.created_at ?? null,
  };
});
