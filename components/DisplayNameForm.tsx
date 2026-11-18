"use client";

import { useId, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { MAX_NAME_LENGTH } from "@/lib/posts";

/**
 * Lets a member change their public display name. Only the profile row
 * changes: the account (user id) stays the same, and posts already on the
 * wall keep the name they were published with.
 */
export function DisplayNameForm({ userId, displayName }: { userId: string; displayName: string }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(displayName);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputId = useId();
  const errorId = useId();

  function cancel() {
    setEditing(false);
    setValue(displayName);
    setError(null);
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;

    const name = value.trim();
    if (!name) return setError("Enter a display name.");
    if (name.length > MAX_NAME_LENGTH) return setError(`At most ${MAX_NAME_LENGTH} characters.`);
    if (name === displayName) return cancel();

    setSaving(true);
    setError(null);
    const { data, error: updateError } = await getSupabaseBrowserClient()
      .from("profiles")
      .update({ display_name: name })
      .eq("id", userId)
      .select("display_name");
    setSaving(false);

    if (updateError || !data?.length) {
      return setError("Couldn't change your name. Please log in again and retry.");
    }

    setEditing(false);
    router.refresh();
  }

  if (!editing) {
    return (
      <p>
        Logged in as <span className="font-bold">{displayName}</span>{" "}
        <button
          type="button"
          onClick={() => {
            setValue(displayName);
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
      <label htmlFor={inputId} className="block font-bold">
        Display name
      </label>
      <input
        id={inputId}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        maxLength={MAX_NAME_LENGTH}
        autoComplete="nickname"
        autoFocus
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
      <p className="text-[11px] text-wall-muted">Applies to your future posts.</p>
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
