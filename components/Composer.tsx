"use client";

import { useId, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import {
  MAX_MESSAGE_LENGTH,
  MAX_NAME_LENGTH,
  POST_COLUMNS,
  validateMessage,
} from "@/lib/posts";
import { useGuestName } from "@/hooks/useGuestName";
import type { CurrentUser, Post } from "@/types/database";

type ComposerProps = {
  currentUser: CurrentUser | null;
  onPosted: (post: Post) => void;
};

type Feedback = { kind: "success" | "error"; text: string } | null;

function describeInsertError(code: string | undefined, isMember: boolean) {
  if (code === "42501") {
    return isMember
      ? "Your session has expired. Please log in again to post as yourself."
      : "That post wasn't allowed. Please refresh the page and try again.";
  }
  if (code === "23514") return `Posts must be between 1 and ${MAX_MESSAGE_LENGTH} characters.`;
  return "Couldn't share your post. Check your connection and try again.";
}

export function Composer({ currentUser, onPosted }: ComposerProps) {
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const inFlight = useRef(false);
  const { guestName, setGuestName } = useGuestName();

  const messageId = useId();
  const counterId = useId();
  const nameId = useId();
  const feedbackId = useId();

  const remaining = MAX_MESSAGE_LENGTH - message.length;
  const canSubmit = !submitting && message.trim().length > 0 && remaining >= 0;

  async function submit() {
    // Guards against double-clicks and Enter-mashing before React re-renders.
    if (inFlight.current) return;

    const problem = validateMessage(message);
    if (problem) {
      setFeedback({ kind: "error", text: problem });
      return;
    }

    inFlight.current = true;
    setSubmitting(true);
    setFeedback(null);

    const name = guestName.trim().slice(0, MAX_NAME_LENGTH);
    const supabase = getSupabaseBrowserClient();
    const { data, error } = await supabase
      .from("posts")
      .insert(
        currentUser
          ? { message, user_id: currentUser.id }
          : { message, user_id: null, author_name: name || "Guest" },
      )
      .select(POST_COLUMNS)
      .single();

    inFlight.current = false;
    setSubmitting(false);

    if (error || !data) {
      setFeedback({ kind: "error", text: describeInsertError(error?.code, !!currentUser) });
      return;
    }

    onPosted(data);
    setMessage("");
    setFeedback({ kind: "success", text: "Your post was shared." });
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void submit();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
      event.preventDefault();
      void submit();
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="border border-wall-border bg-wall-pale p-2.5"
      aria-busy={submitting}
    >
      <label htmlFor={messageId} className="sr-only">
        Write something on the wall
      </label>
      <textarea
        id={messageId}
        value={message}
        onChange={(event) => {
          setMessage(event.target.value);
          if (feedback) setFeedback(null);
        }}
        onKeyDown={handleKeyDown}
        maxLength={MAX_MESSAGE_LENGTH}
        rows={3}
        placeholder="Write something..."
        aria-describedby={`${counterId} ${feedbackId}`}
        aria-invalid={feedback?.kind === "error" || undefined}
        className="input-wall block min-h-[64px] resize-y"
      />

      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-2">
        {currentUser ? (
          <p className="text-[11px] text-wall-muted">
            Posting as <span className="font-bold text-wall-text">{currentUser.displayName}</span>
          </p>
        ) : (
          <div className="flex items-center gap-1.5">
            <label htmlFor={nameId} className="whitespace-nowrap text-[11px] text-wall-muted">
              Your name
            </label>
            <input
              id={nameId}
              value={guestName}
              onChange={(event) => setGuestName(event.target.value)}
              maxLength={MAX_NAME_LENGTH}
              placeholder="Guest"
              autoComplete="nickname"
              className="input-wall w-36 py-1 text-[12px]"
            />
          </div>
        )}

        <span
          id={counterId}
          aria-live="polite"
          className={`ml-auto text-[11px] ${remaining <= 20 ? "font-bold text-wall-error" : "text-wall-muted"}`}
        >
          {remaining} {remaining === 1 ? "character" : "characters"} left
        </span>

        <button type="submit" className="btn-wall" disabled={!canSubmit}>
          {submitting ? "Sharing…" : "Share"}
        </button>
      </div>

      <div id={feedbackId} role="status" aria-live="polite">
        {feedback && (
          <p
            className={`mt-2 border px-2 py-1.5 text-[12px] ${
              feedback.kind === "error"
                ? "border-wall-error bg-wall-error-bg text-wall-text"
                : "border-wall-ok-border bg-wall-ok-bg text-wall-text"
            }`}
          >
            {feedback.text}
          </p>
        )}
      </div>
    </form>
  );
}
