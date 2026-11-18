"use client";

import { useState } from "react";
import { useLivePosts } from "@/hooks/useLivePosts";
import type { CurrentUser, Post } from "@/types/database";
import { Composer } from "./Composer";
import { PostItem } from "./PostItem";

type WallProps = {
  initialPosts: Post[];
  initialError: string | null;
  currentUser: CurrentUser | null;
  /** Show only this user's posts (the "My Posts" view). */
  filterUserId?: string;
  heading: string;
  emptyMessage: string;
};

export function Wall({
  initialPosts,
  initialError,
  currentUser,
  filterUserId,
  heading,
  emptyMessage,
}: WallProps) {
  const { posts, addPosts, connection, refreshError } = useLivePosts(
    initialPosts,
    filterUserId,
  );
  // Ids of posts that arrived after the page loaded, for a brief highlight.
  const [initialIds] = useState(() => new Set(initialPosts.map((post) => post.id)));
  const loadError = posts.length === 0 ? (refreshError ?? initialError) : null;

  return (
    <section aria-labelledby="wall-heading" className="space-y-3">
      <Composer currentUser={currentUser} onPosted={(post) => addPosts([post])} />

      <div className="flex items-center justify-between border-b border-wall-line pb-1">
        <h2 id="wall-heading" className="text-[13px] font-bold text-wall-text">
          {heading}
        </h2>
        <ConnectionBadge state={connection} />
      </div>

      {refreshError && posts.length > 0 && (
        <p role="alert" className="border border-wall-error bg-wall-error-bg px-2 py-1.5 text-[12px]">
          {refreshError}
        </p>
      )}

      {loadError ? (
        <p role="alert" className="border border-wall-error bg-wall-error-bg px-3 py-4 text-center">
          {loadError}
        </p>
      ) : posts.length === 0 ? (
        <p className="border border-wall-line bg-wall-panel px-3 py-6 text-center text-wall-muted">
          {emptyMessage}
        </p>
      ) : (
        <ol aria-label={heading} className="-mt-3">
          {posts.map((post) => (
            <PostItem
              key={post.id}
              post={post}
              isOwn={!!currentUser && post.user_id === currentUser.id}
              highlight={!initialIds.has(post.id)}
            />
          ))}
        </ol>
      )}
    </section>
  );
}

function ConnectionBadge({ state }: { state: "connecting" | "live" | "reconnecting" }) {
  const label =
    state === "live" ? "Live" : state === "connecting" ? "Connecting…" : "Reconnecting…";
  const color =
    state === "live" ? "bg-wall-green" : state === "connecting" ? "bg-wall-border" : "bg-wall-error";

  return (
    <span className="flex items-center gap-1.5 text-[11px] text-wall-muted" aria-live="polite">
      <span className={`inline-block h-2 w-2 rounded-full ${color}`} aria-hidden="true" />
      {label}
    </span>
  );
}
