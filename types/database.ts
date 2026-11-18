/**
 * Database types for the Supabase client.
 *
 * Hand-written to match supabase/migrations. Regenerate with
 * `supabase gen types typescript` if the schema grows.
 */
export type Database = {
  public: {
    Tables: {
      posts: {
        Row: {
          id: string;
          user_id: string | null;
          author_name: string;
          message: string;
          created_at: string;
          author_avatar_path: string | null;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          author_name?: string;
          message: string;
          created_at?: string;
        };
        Update: never;
        Relationships: [];
      };
      profiles: {
        Row: {
          id: string;
          display_name: string;
          avatar_path: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          display_name: string;
          created_at?: string;
        };
        Update: {
          display_name?: string;
          avatar_path?: string | null;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

export type Post = Database["public"]["Tables"]["posts"]["Row"];
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];

/** The signed-in user as the UI needs it. Never contains tokens. */
export type CurrentUser = {
  id: string;
  email: string | null;
  displayName: string;
  /** Public URL of the member's photo, or null for the default silhouette. */
  avatarUrl: string | null;
  memberSince: string | null;
};
