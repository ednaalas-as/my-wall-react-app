"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export function LogoutButton({ className = "" }: { className?: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function logOut() {
    setPending(true);
    // "local" ends this browser's session without logging out other devices.
    await getSupabaseBrowserClient().auth.signOut({ scope: "local" });
    router.replace("/");
    router.refresh();
    setPending(false);
  }

  return (
    <button type="button" onClick={logOut} disabled={pending} className={className}>
      {pending ? "Logging out…" : "Log out"}
    </button>
  );
}
