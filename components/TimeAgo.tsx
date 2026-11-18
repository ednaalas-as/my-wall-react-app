"use client";

import { useSyncExternalStore } from "react";

// A shared clock that ticks every 30 seconds while any timestamp is on screen.
let now = Date.now();
let timer: ReturnType<typeof setInterval> | undefined;
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  if (!timer) {
    now = Date.now();
    timer = setInterval(() => {
      now = Date.now();
      listeners.forEach((notify) => notify());
    }, 30_000);
  }
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0 && timer) {
      clearInterval(timer);
      timer = undefined;
    }
  };
}

const getSnapshot = () => now;
// The server (and the first client render) has no clock, so both render the
// same fixed UTC date and hydration always matches.
const getServerSnapshot = () => null;

const utcFormat = new Intl.DateTimeFormat("en-US", {
  month: "long",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});

function timeOfDay(date: Date) {
  return date
    .toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
    .replace(" ", "")
    .toLowerCase();
}

/** "2 minutes ago", "Yesterday at 3:15pm", "November 3 at 3:15pm" */
function describe(date: Date, nowMs: number) {
  const seconds = Math.max(0, Math.round((nowMs - date.getTime()) / 1000));
  if (seconds < 60) return "a few seconds ago";

  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return minutes === 1 ? "about a minute ago" : `${minutes} minutes ago`;

  const hours = Math.round(minutes / 60);
  if (hours < 24) return hours === 1 ? "about an hour ago" : `${hours} hours ago`;

  const yesterday = new Date(nowMs);
  yesterday.setDate(yesterday.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) {
    return `Yesterday at ${timeOfDay(date)}`;
  }

  const sameYear = date.getFullYear() === new Date(nowMs).getFullYear();
  const day = date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    ...(sameYear ? {} : { year: "numeric" }),
  });
  return `${day} at ${timeOfDay(date)}`;
}

export function TimeAgo({ iso }: { iso: string }) {
  const nowMs = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const date = new Date(iso);

  return (
    <time
      dateTime={iso}
      title={nowMs === null ? undefined : date.toLocaleString()}
    >
      {nowMs === null ? utcFormat.format(date) : describe(date, nowMs)}
    </time>
  );
}
