"use client";

import Link from "next/link";
import { useId, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { MAX_NAME_LENGTH } from "@/lib/posts";

const MIN_PASSWORD_LENGTH = 8;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Mode = "login" | "register";
type Status =
  | { kind: "idle" }
  | { kind: "error"; text: string }
  | { kind: "check-email"; email: string };

function friendlyAuthError(message: string) {
  const text = message.toLowerCase();
  if (text.includes("invalid login credentials")) return "Incorrect email or password.";
  if (text.includes("email not confirmed")) {
    return "Please confirm your email address first. Check your inbox for the link.";
  }
  if (text.includes("already registered")) return "An account with this email already exists. Try logging in.";
  if (text.includes("rate limit")) return "Too many attempts. Please wait a minute and try again.";
  if (text.includes("password")) return message;
  return "Something went wrong. Please try again.";
}

export function AuthForm({ mode, next }: { mode: Mode; next: string }) {
  const router = useRouter();
  const isRegister = mode === "register";
  const [values, setValues] = useState({ displayName: "", email: "", password: "", confirm: "" });
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof typeof values, string>>>({});
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [submitting, setSubmitting] = useState(false);
  const ids = { name: useId(), email: useId(), password: useId(), confirm: useId(), status: useId() };

  function update(field: keyof typeof values, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
    setFieldErrors((current) => ({ ...current, [field]: undefined }));
  }

  function validate() {
    const errors: typeof fieldErrors = {};
    if (isRegister && !values.displayName.trim()) errors.displayName = "Enter the name to show on your posts.";
    if (!EMAIL_PATTERN.test(values.email.trim())) errors.email = "Enter a valid email address.";
    if (isRegister && values.password.length < MIN_PASSWORD_LENGTH) {
      errors.password = `Use at least ${MIN_PASSWORD_LENGTH} characters.`;
    } else if (!values.password) {
      errors.password = "Enter your password.";
    }
    if (isRegister && values.confirm !== values.password) errors.confirm = "Passwords don't match.";
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting || !validate()) return;

    setSubmitting(true);
    setStatus({ kind: "idle" });
    const supabase = getSupabaseBrowserClient();
    const email = values.email.trim();

    if (isRegister) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password: values.password,
        options: {
          data: { display_name: values.displayName.trim().slice(0, MAX_NAME_LENGTH) },
          emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
        },
      });
      setSubmitting(false);

      if (error) return setStatus({ kind: "error", text: friendlyAuthError(error.message) });
      // With email confirmation on, Supabase hides whether the address is
      // taken and returns a user without identities for existing accounts.
      if (data.user && data.user.identities?.length === 0) {
        return setStatus({ kind: "error", text: "An account with this email already exists. Try logging in." });
      }
      if (!data.session) return setStatus({ kind: "check-email", email });
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password: values.password });
      setSubmitting(false);
      if (error) return setStatus({ kind: "error", text: friendlyAuthError(error.message) });
    }

    router.replace(next);
    router.refresh();
  }

  if (status.kind === "check-email") {
    return (
      <div role="status" className="space-y-3">
        <p className="border border-wall-ok-border bg-wall-ok-bg p-3">
          Almost done! We sent a confirmation link to <strong className="break-all">{status.email}</strong>.
          Open it to activate your account, then log in.
        </p>
        <p className="text-[12px]">
          <Link href="/">Back to the wall</Link> — you can keep posting as a guest meanwhile.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-3" aria-describedby={ids.status}>
      {isRegister && (
        <Field id={ids.name} label="Display name" error={fieldErrors.displayName}>
          <input
            id={ids.name}
            value={values.displayName}
            onChange={(e) => update("displayName", e.target.value)}
            maxLength={MAX_NAME_LENGTH}
            autoComplete="nickname"
            className="input-wall"
            aria-invalid={!!fieldErrors.displayName || undefined}
            aria-describedby={fieldErrors.displayName ? `${ids.name}-error` : undefined}
          />
        </Field>
      )}

      <Field id={ids.email} label="Email" error={fieldErrors.email}>
        <input
          id={ids.email}
          type="email"
          value={values.email}
          onChange={(e) => update("email", e.target.value)}
          autoComplete="email"
          className="input-wall"
          aria-invalid={!!fieldErrors.email || undefined}
          aria-describedby={fieldErrors.email ? `${ids.email}-error` : undefined}
        />
      </Field>

      <Field id={ids.password} label="Password" error={fieldErrors.password}>
        <input
          id={ids.password}
          type="password"
          value={values.password}
          onChange={(e) => update("password", e.target.value)}
          autoComplete={isRegister ? "new-password" : "current-password"}
          className="input-wall"
          aria-invalid={!!fieldErrors.password || undefined}
          aria-describedby={fieldErrors.password ? `${ids.password}-error` : undefined}
        />
      </Field>

      {isRegister && (
        <Field id={ids.confirm} label="Confirm password" error={fieldErrors.confirm}>
          <input
            id={ids.confirm}
            type="password"
            value={values.confirm}
            onChange={(e) => update("confirm", e.target.value)}
            autoComplete="new-password"
            className="input-wall"
            aria-invalid={!!fieldErrors.confirm || undefined}
            aria-describedby={fieldErrors.confirm ? `${ids.confirm}-error` : undefined}
          />
        </Field>
      )}

      <div id={ids.status} role="alert">
        {status.kind === "error" && (
          <p className="border border-wall-error bg-wall-error-bg px-2 py-1.5 text-[12px]">{status.text}</p>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3 pt-1">
        <button type="submit" className="btn-wall" disabled={submitting}>
          {submitting ? (isRegister ? "Signing up…" : "Logging in…") : isRegister ? "Sign Up" : "Log In"}
        </button>
        <p className="text-[12px]">
          {isRegister ? (
            <>Already have an account? <Link href={`/login?next=${encodeURIComponent(next)}`}>Log in</Link></>
          ) : (
            <>New here? <Link href={`/register?next=${encodeURIComponent(next)}`}>Sign up</Link></>
          )}
        </p>
      </div>

      <p className="border-t border-wall-line pt-3 text-[12px] text-wall-muted">
        An account is optional. <Link href="/">Go back to the wall</Link> to post as a guest.
      </p>
    </form>
  );
}

function Field({
  id,
  label,
  error,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-[12px] font-bold">
        {label}
      </label>
      {children}
      {error && (
        <p id={`${id}-error`} className="mt-1 text-[11px] text-wall-error">
          {error}
        </p>
      )}
    </div>
  );
}
