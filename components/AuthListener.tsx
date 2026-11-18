"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

/**
 * Re-renders server components when the session changes in this tab or
 * another one (login, logout, or a refresh token that has expired), so the
 * header, composer and My Posts never show a stale account.
 */
export function AuthListener() {
  const router = useRouter();

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN" || event === "SIGNED_OUT") router.refresh();
    });
    return () => data.subscription.unsubscribe();
  }, [router]);

  return null;
}
