"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { fetchPosts, mergePosts } from "@/lib/posts";
import type { Post } from "@/types/database";

export type ConnectionState = "connecting" | "live" | "reconnecting";

const FALLBACK_POLL_MS = 15_000;

/**
 * Keeps a list of posts in sync with Supabase.
 *
 * - Starts from the server-rendered posts (works even if Realtime is down).
 * - Adds new posts as Realtime INSERT events arrive.
 * - De-duplicates by id, so a post that arrives both from our own insert and
 *   from Realtime is shown once.
 * - After a dropped connection, re-fetches to fill any gap, and polls while
 *   Realtime is unavailable.
 */
export function useLivePosts(initialPosts: Post[], filterUserId?: string) {
  const [posts, setPosts] = useState<Post[]>(initialPosts);
  const [connection, setConnection] = useState<ConnectionState>("connecting");
  const [refreshError, setRefreshError] = useState<string | null>(null);
  const hasDisconnected = useRef(false);

  const addPosts = useCallback((incoming: Post[]) => {
    setPosts((current) => mergePosts(current, incoming));
  }, []);

  const refresh = useCallback(async () => {
    const supabase = getSupabaseBrowserClient();
    const { data, error } = await fetchPosts(supabase, filterUserId);
    if (error) {
      setRefreshError("Couldn't refresh the wall. Retrying shortly…");
      return;
    }
    setRefreshError(null);
    addPosts(data);
  }, [addPosts, filterUserId]);

  // Realtime subscription.
  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    // Status callbacks from a channel we already removed (e.g. "CLOSED" after
    // unmount) must not overwrite the state of the current subscription.
    let active = true;
    // A unique topic per subscription: supabase-js reuses a channel with the
    // same topic, which would hand a remount the channel being torn down.
    const topic = `wall-posts:${filterUserId ?? "all"}:${Math.random().toString(36).slice(2)}`;
    const channel = supabase
      .channel(topic)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "posts",
          ...(filterUserId ? { filter: `user_id=eq.${filterUserId}` } : {}),
        },
        (payload) => addPosts([payload.new as Post]),
      )
      .subscribe((status) => {
        if (!active) return;
        if (status === "SUBSCRIBED") {
          setConnection("live");
          if (hasDisconnected.current) {
            hasDisconnected.current = false;
            void refresh();
          }
        } else if (
          status === "CHANNEL_ERROR" ||
          status === "TIMED_OUT" ||
          status === "CLOSED"
        ) {
          hasDisconnected.current = true;
          setConnection("reconnecting");
        }
      });

    return () => {
      active = false;
      void supabase.removeChannel(channel);
    };
  }, [addPosts, filterUserId, refresh]);

  // Fallback: poll while Realtime is unavailable.
  useEffect(() => {
    if (connection !== "reconnecting") return;
    const id = setInterval(() => void refresh(), FALLBACK_POLL_MS);
    return () => clearInterval(id);
  }, [connection, refresh]);

  // Catch up when the tab regains focus or the network comes back.
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    const onOnline = () => void refresh();
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("online", onOnline);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("online", onOnline);
    };
  }, [refresh]);

  return { posts, addPosts, connection, refreshError };
}
