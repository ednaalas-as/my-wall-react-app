/**
 * Public Supabase settings. Only the project URL and the publishable (anon)
 * key belong here: both are safe in the browser because Row Level Security
 * enforces access. Never put a service-role / secret key in a NEXT_PUBLIC_ var.
 */
export function getSupabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "Missing Supabase settings. Copy .env.example to .env.local and set " +
        "NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.",
    );
  }

  return { url, anonKey };
}
