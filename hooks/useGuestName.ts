"use client";

import { useCallback, useState, useSyncExternalStore } from "react";

// A guest's display name lives only in this browser tab's session
// (sessionStorage): it survives a reload but resets when the tab is closed.
// Posts themselves always live in Supabase.
const STORAGE_KEY = "great-wall:guest-name";

function readStored() {
  try {
    return window.sessionStorage.getItem(STORAGE_KEY) ?? "";
  } catch {
    return "";
  }
}

// sessionStorage is per tab, so there is nothing to subscribe to.
const subscribe = () => () => {};

export function useGuestName() {
  const stored = useSyncExternalStore(subscribe, readStored, () => "");
  const [draft, setDraft] = useState<string | null>(null);

  const setGuestName = useCallback((name: string) => {
    setDraft(name);
    try {
      window.sessionStorage.setItem(STORAGE_KEY, name);
    } catch {
      // Private mode or blocked storage: the name still works for this page.
    }
  }, []);

  return { guestName: draft ?? stored, setGuestName };
}
