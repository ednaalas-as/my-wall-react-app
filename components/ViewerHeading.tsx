"use client";

import { siteName } from "@/lib/site-config";
import { useGuestName } from "@/hooks/useGuestName";
import type { CurrentUser } from "@/types/database";

/** The profile heading: the signed-in member's name, or the guest's name. */
export function ViewerHeading({ user }: { user: CurrentUser | null }) {
  const guestName = useGuestName();
  const name = user ? user.displayName : guestName;

  return (
    <div className="border-b border-wall-line pb-3">
      <h1 className="text-[20px] font-bold leading-tight text-wall-text">{name}</h1>
      <p className="mt-1 text-[13px]">
        <span className="font-bold">{name}</span> is writing on {siteName}
        {user ? "." : " as a guest."}
      </p>
    </div>
  );
}
