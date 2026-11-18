import { ProfileLayout } from "@/components/ProfileLayout";
import { Wall } from "@/components/Wall";
import { getCurrentUser } from "@/lib/auth";
import { fetchPosts } from "@/lib/posts";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function WallPage() {
  const supabase = await createSupabaseServerClient();
  const [user, { data: posts, error }] = await Promise.all([
    getCurrentUser(),
    fetchPosts(supabase),
  ]);

  return (
    <ProfileLayout user={user} activeTab="wall">
      <Wall
        // Remount when the account changes so the feed and composer reset.
        key={user?.id ?? "guest"}
        initialPosts={posts ?? []}
        initialError={error ? "Couldn't load the wall. Please refresh the page." : null}
        currentUser={user}
        heading="Wall"
        emptyMessage="No posts yet. Be the first to write on the wall!"
      />
    </ProfileLayout>
  );
}
