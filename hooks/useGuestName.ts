"use client";

import { useCallback, useState, useSyncExternalStore } from "react";

// A convenience only: remembers the name a guest typed, in this browser.
// Posts themselves always live in Supabase.
const STORAGE_KEY = "my-wall:guest-name";

function readStored() {
  try {
    return window.localStorage.getItem(STORAGE_KEY) ?? "";
  } catch {
    return "";
  }
}

function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange);
  return () => window.removeEventListener("storage", onChange);
}

export function useGuestName() {
  const stored = useSyncExternalStore(subscribe, readStored, () => "");
  const [draft, setDraft] = useState<string | null>(null);

  const remember = useCallback((name: string) => {
    try {
      window.localStorage.setItem(STORAGE_KEY, name);
    } catch {
      // Private mode or blocked storage: nothing to remember.
    }
  }, []);

  return { guestName: draft ?? stored, setGuestName: setDraft, rememberGuestName: remember };
}
