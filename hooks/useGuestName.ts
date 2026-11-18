"use client";

import { useSyncExternalStore } from "react";
import { MAX_NAME_LENGTH } from "@/lib/posts";

// A guest's display name lives only in this browser tab's session
// (sessionStorage): it survives a reload but resets when the tab is closed.
// It is shared by the profile area (where it is edited) and the composer.
const STORAGE_KEY = "great-wall:guest-name";
export const DEFAULT_GUEST_NAME = "Guest";

const listeners = new Set<() => void>();

function read() {
  try {
    return window.sessionStorage.getItem(STORAGE_KEY) || DEFAULT_GUEST_NAME;
  } catch {
    return memoryName;
  }
}

// Fallback when storage is blocked (private mode, strict settings).
let memoryName = DEFAULT_GUEST_NAME;

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function setGuestName(name: string) {
  const clean = name.trim().slice(0, MAX_NAME_LENGTH) || DEFAULT_GUEST_NAME;
  memoryName = clean;
  try {
    window.sessionStorage.setItem(STORAGE_KEY, clean);
  } catch {
    // Storage blocked: the in-memory name still works for this page.
  }
  listeners.forEach((notify) => notify());
}

/** The current guest name ("Guest" until the guest picks one). */
export function useGuestName() {
  return useSyncExternalStore(subscribe, read, () => DEFAULT_GUEST_NAME);
}
