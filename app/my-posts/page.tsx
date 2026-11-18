import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ProfileLayout } from "@/components/ProfileLayout";
import { Wall } from "@/components/Wall";
import { getCurrentUser } from "@/lib/auth";
import { fetchPosts } from "@/lib/posts";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "My Posts" };

export default async function MyPostsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/my-posts");

  // Filtered by the verified user id from the session, never from the URL.
  const supabase = await createSupabaseServerClient();
  const { data: posts, error } = await fetchPosts(supabase, user.id);

  return (
    <ProfileLayout user={user} activeTab="my-posts">
      <Wall
        key={user.id}
        initialPosts={posts ?? []}
        initialError={error ? "Couldn't load your posts. Please refresh the page." : null}
        currentUser={user}
        filterUserId={user.id}
        heading={`Posts by ${user.displayName}`}
        emptyMessage="You haven't posted anything yet. Write your first message above!"
      />
    </ProfileLayout>
  );
}
