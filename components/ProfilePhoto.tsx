"use client";

import Image from "next/image";
import { useEffect, useId, useState, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import {
  AVATAR_BUCKET,
  AVATAR_TYPES,
  DEFAULT_PROFILE_PHOTO,
  validateAvatar,
} from "@/lib/avatars";
import type { CurrentUser } from "@/types/database";

/**
 * The big profile picture. Members can replace it: pick an image, preview
 * it, then save. Guests see the default silhouette.
 */
export function ProfilePhoto({ user }: { user: CurrentUser | null }) {
  const router = useRouter();
  const inputId = useId();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Free the preview's object URL when it changes or the component unmounts.
  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  function choose(event: ChangeEvent<HTMLInputElement>) {
    const picked = event.target.files?.[0];
    event.target.value = "";
    if (!picked) return;
    const problem = validateAvatar(picked);
    if (problem) {
      setError(problem);
      return;
    }
    setError(null);
    setFile(picked);
    setPreview(URL.createObjectURL(picked));
  }

  function cancel() {
    setFile(null);
    setPreview(null);
    setError(null);
  }

  async function save() {
    if (!user || !file || saving) return;
    setSaving(true);
    setError(null);

    const supabase = getSupabaseBrowserClient();
    // A new file name every time: older posts keep pointing at their photo.
    const path = `${user.id}/${Date.now()}.${AVATAR_TYPES[file.type]}`;
    const upload = await supabase.storage
      .from(AVATAR_BUCKET)
      .upload(path, file, { contentType: file.type, cacheControl: "31536000" });

    if (upload.error) {
      setSaving(false);
      setError("Upload failed. Please try again with a smaller image.");
      return;
    }

    const { data, error: updateError } = await supabase
      .from("profiles")
      .update({ avatar_path: path })
      .eq("id", user.id)
      .select("id");

    setSaving(false);
    if (updateError || !data?.length) {
      setError("Couldn't save your photo. Please log in again and retry.");
      return;
    }

    setFile(null);
    router.refresh();
    // Keep showing the preview until the refreshed profile arrives.
  }

  const src = preview ?? user?.avatarUrl ?? DEFAULT_PROFILE_PHOTO;
  const name = user?.displayName ?? "Guest";

  return (
    <div className="w-28 shrink-0 sm:w-36 md:w-full">
      <Image
        key={src}
        src={src}
        alt={`Profile photo of ${name}`}
        width={200}
        height={240}
        priority
        unoptimized
        className="aspect-[5/6] h-auto w-full border border-wall-border bg-wall-pale object-cover"
      />

      {user && (
        <div className="mt-1.5 space-y-1.5 text-[12px]">
          {file ? (
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={save} className="btn-wall" disabled={saving}>
                {saving ? "Saving…" : "Save photo"}
              </button>
              <button type="button" onClick={cancel} className="btn-plain" disabled={saving}>
                Cancel
              </button>
            </div>
          ) : (
            <label
              htmlFor={inputId}
              className="cursor-pointer text-wall-link hover:underline focus-within:underline"
            >
              Change photo
              <input
                id={inputId}
                type="file"
                accept={Object.keys(AVATAR_TYPES).join(",")}
                onChange={choose}
                className="sr-only"
              />
            </label>
          )}
          {error && (
            <p role="alert" className="text-[11px] text-wall-error">
              {error}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
