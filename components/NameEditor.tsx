"use client";

import { useId, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { MAX_NAME_LENGTH } from "@/lib/posts";
import { setGuestName, useGuestName } from "@/hooks/useGuestName";

type NameEditorProps = {
  name: string;
  hint: string;
  /** Saves the name; resolves to an error message, or null on success. */
  onSave: (name: string) => Promise<string | null>;
};

/** "Name: X (change)" that turns into a small inline form. */
function NameEditor({ name, hint, onSave }: NameEditorProps) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(name);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputId = useId();
  const errorId = useId();

  function cancel() {
    setEditing(false);
    setError(null);
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    const next = value.trim();
    if (!next) return setError("Enter a name.");
    if (next.length > MAX_NAME_LENGTH) return setError(`At most ${MAX_NAME_LENGTH} characters.`);
    if (next === name) return cancel();

    setSaving(true);
    setError(null);
    const problem = await onSave(next);
    setSaving(false);
    if (problem) return setError(problem);
    setEditing(false);
  }

  if (!editing) {
    return (
      <p>
        <span className="font-bold">{name}</span>{" "}
        <button
          type="button"
          onClick={() => {
            setValue(name);
            setEditing(true);
          }}
          className="cursor-pointer text-wall-link hover:underline"
        >
          (change name)
        </button>
      </p>
    );
  }

  return (
    <form onSubmit={save} className="space-y-1.5" aria-busy={saving}>
      <label htmlFor={inputId} className="sr-only">
        Display name
      </label>
      <input
        id={inputId}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        maxLength={MAX_NAME_LENGTH}
        autoComplete="nickname"
        autoFocus
        onFocus={(e) => e.target.select()}
        className="input-wall py-1"
        aria-invalid={!!error || undefined}
        aria-describedby={error ? errorId : undefined}
        onKeyDown={(e) => e.key === "Escape" && cancel()}
      />
      {error && (
        <p id={errorId} role="alert" className="text-[11px] text-wall-error">
          {error}
        </p>
      )}
      <p className="text-[11px] text-wall-muted">{hint}</p>
      <div className="flex gap-2">
        <button type="submit" className="btn-wall" disabled={saving}>
          {saving ? "Saving…" : "Save"}
        </button>
        <button type="button" onClick={cancel} className="btn-plain" disabled={saving}>
          Cancel
        </button>
      </div>
    </form>
  );
}

/**
 * Members: updates only the profile row. The account (user id) never
 * changes, and posts already on the wall keep their original name.
 */
export function MemberNameEditor({ userId, displayName }: { userId: string; displayName: string }) {
  const router = useRouter();

  async function save(name: string) {
    const { data, error } = await getSupabaseBrowserClient()
      .from("profiles")
      .update({ display_name: name })
      .eq("id", userId)
      .select("id");
    if (error || !data?.length) return "Couldn't change your name. Please log in again and retry.";
    router.refresh();
    return null;
  }

  return (
    <NameEditor
      name={displayName}
      hint="Saved to your account. Applies to your future posts."
      onSave={save}
    />
  );
}

/** Guests: kept for this browser tab only, used for their next posts. */
export function GuestNameEditor() {
  const guestName = useGuestName();

  async function save(name: string) {
    setGuestName(name);
    return null;
  }

  return (
    <NameEditor
      name={guestName}
      hint="Used for your next posts. Resets when you close this tab."
      onSave={save}
    />
  );
}
