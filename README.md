# The Great Wall of Edna

**Live demo:** https://my-wall-react-app-gamma.vercel.app

Deployed on Vercel. Every push to `main` redeploys automatically.

A nostalgic, late-2000s style message wall built with **Next.js, React, TypeScript, Tailwind CSS and Supabase**.

Anyone can open the wall, type a message and press **Share**: no account needed. Visitors who want to keep track of what they've written can optionally sign up, and get a personal **My Posts** history that follows them across sessions and devices.

> This is an independent project inspired by the look of early social network profiles. It is not affiliated with, or endorsed by, any social network.

---

## Features

**Core wall**
- Profile-style layout: profile photo, name, status line, information box, wall tab.
- Composer with a live 280-character counter. Empty and whitespace-only messages are rejected.
- Double submissions are blocked while a post is being saved.
- Success and error messages are announced to screen readers.
- Posts are stored in Supabase and listed newest first. The latest 50 load on page load and stay after a refresh.
- New posts appear immediately without a page reload.

**Live updates**
- Supabase Realtime pushes new posts to every open wall: guests and members, in any browser or device.
- Posts are de-duplicated by id, so your own post never shows twice.
- If Realtime drops, a status badge shows *Reconnecting…*, the feed polls every 15 seconds, and it catches up when the connection, the network or the browser tab comes back.

**Guests (no login)**
- Read and post immediately, with an optional display name (defaults to "Guest").
- The name can be changed at any time and applies to the guest's next posts.
- It is remembered only for the current browser tab session, and resets when the tab is closed.
- Guest posts are saved with `user_id = NULL` and never linked to an account.

**Optional accounts**

Registering is deliberately simple. There is no post editing, deleting or profile customisation. The only extras are a persistent identity, a changeable display name and a My Posts history.

- Sign up (display name, email, password, confirmation), log in, log out, built on Supabase Auth.
- Supports email confirmation when it's turned on in Supabase.
- Sessions persist across refreshes and are refreshed on each request by `proxy.ts`.
- An expired session falls back to the guest view cleanly.
- Members' posts are saved with `user_id = auth.uid()` and carry their profile name, which can't be spoofed.
- Members can change their display name at any time with **(change name)** in the account box. The new name is saved in Supabase, so it follows them across sessions and devices.
- Changing the name updates only the `profiles` row. The account and its user ID stay the same, so every post stays linked to it. Posts already on the wall keep the name they were published with; the new name applies to future posts only.
- **My Posts** (`/my-posts`) lists only the signed-in user's posts, updates live, and is redirected to login for guests.

**Quality**
- Responsive from 320px phones to desktop, with no horizontal scroll.
- Keyboard accessible: skip link, visible focus, labelled controls, Ctrl/⌘ + Enter to share.
- Loading, empty and error states.
- Strict TypeScript, ESLint, and a typed Supabase client.

## Tech stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router, `proxy.ts`) with React 19 |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS 4 |
| Database | Supabase Postgres with Row Level Security |
| Auth | Supabase Auth via `@supabase/ssr` (cookie sessions) |
| Live feed | Supabase Realtime (`postgres_changes`) |
| Hosting | Vercel |

## Project structure

```
app/
  layout.tsx             Root layout: top bar, auth listener, footer
  page.tsx               The public wall (server-fetches the latest 50 posts)
  my-posts/page.tsx      Signed-in user's posts (redirects guests to /login)
  login/ register/       Optional account pages
  auth/callback/route.ts Email-confirmation landing route
  loading.tsx error.tsx  Loading skeleton and error boundary
components/
  ProfileLayout.tsx      Profile page frame (photo, name, tabs)
  ProfileSidebar.tsx     Profile card + account box
  DisplayNameForm.tsx    Members' "change name" form
  Wall.tsx               Composer + live feed (client)
  Composer.tsx           Message form with validation and counter
  PostItem.tsx           One wall post
  TimeAgo.tsx            Hydration-safe "5 minutes ago"
  AuthForm.tsx AuthCard.tsx LogoutButton.tsx AuthListener.tsx TopBar.tsx
hooks/
  useLivePosts.ts        Realtime subscription, de-dupe, reconnect + polling fallback
  useGuestName.ts        Remembers a guest's display name for this tab session (sessionStorage)
lib/
  supabase/              The only place Supabase clients are created (browser, server, proxy)
  auth.ts                getCurrentUser(): verified session → user
  posts.ts               Validation, fetch and merge helpers
  site-config.ts         Wall owner's name, status, photo and info: edit me
types/database.ts        Database, Post, Profile, CurrentUser types
supabase/migrations/     SQL for tables, triggers, RLS, grants, Realtime
proxy.ts                 Refreshes the auth session on each request
```

## Getting started

### 1. Prerequisites
- Node.js 20.9+ (22 LTS recommended)
- A free [Supabase](https://supabase.com) account

### 2. Install

```bash
git clone https://github.com/<your-username>/my-wall-react-app.git
cd my-wall-react-app
npm install
```

### 3. Create a Supabase project
1. In the [Supabase dashboard](https://supabase.com/dashboard), click **New project**.
2. Choose a name, a strong database password (keep it to yourself) and a nearby region.
3. Wait for the project to finish provisioning.

### 4. Run the SQL migrations
Run each file in `supabase/migrations/` **in order**: open **SQL Editor → New query**, paste the file, and click **Run**.
1. [`20261118000000_init_wall.sql`](supabase/migrations/20261118000000_init_wall.sql): tables, triggers, RLS, grants and Realtime.
2. [`20261118010000_lock_down_trigger_functions.sql`](supabase/migrations/20261118010000_lock_down_trigger_functions.sql): stops the trigger functions from being callable as RPC endpoints.

If you use the Supabase CLI, you can apply both with `supabase link --project-ref <ref>` and then `supabase db push`.

Together they create the following. Both scripts are safe to run again.

| Object | Purpose |
|---|---|
| `posts` | `id`, nullable `user_id → auth.users`, `author_name`, `message` (1–280 chars), `created_at` |
| `profiles` | `id → auth.users`, `display_name`, `created_at` |
| `normalize_post` trigger | Server-side timestamp, trimmed message, member name taken from their profile |
| `handle_new_user` trigger | Creates a profile on sign-up |
| RLS policies, grants | See [Security](#security) |
| Realtime | Adds `posts` to the `supabase_realtime` publication |

### 5. Environment variables
In Supabase, open **Project Settings → API Keys** (or **Settings → API** in older dashboards) and copy:
- the **Project URL**
- the **publishable** key (or the legacy **anon public** key)

```bash
cp .env.example .env.local
```

```env
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<publishable-or-anon-key>
```

`.env.local` is git-ignored. Both values are designed to be public: Row Level Security protects the data. **Never** use the `service_role` / secret key in this app or in any `NEXT_PUBLIC_` variable.

### 6. Authentication settings
In **Authentication → Sign In / Providers → Email**, make sure Email is enabled.
- **Confirm email OFF** (used by the live demo): users are logged in straight after signing up.
- **Confirm email ON**: new users get a link and must click it before logging in. The app shows a "check your email" message. Supabase's built-in mailer only delivers to members of your Supabase team, so set up custom SMTP before turning this on for the public.

In **Authentication → URL Configuration**:
- **Site URL**: your production URL, e.g. `https://my-wall-react-app.vercel.app`
- **Redirect URLs**: add `http://localhost:3000/**` and `https://<your-vercel-domain>/**`

Confirmation links land on `/auth/callback`, which signs the user in and sends them to My Posts.

### 7. Realtime
The migration already adds `posts` to the `supabase_realtime` publication. To check, open **Database → Publications → supabase_realtime** and confirm `posts` is enabled.

### 8. Run locally

```bash
npm run dev
```

Open http://localhost:3000.

| Script | What it does |
|---|---|
| `npm run dev` | Development server |
| `npm run lint` | ESLint |
| `npm run typecheck` | Generates route types and runs `tsc --noEmit` |
| `npm run build` | Production build |

### 9. Personalise
Edit `lib/site-config.ts` (site name, owner name, status, info) and replace `public/profile-placeholder.svg` with your own photo. If you use a `.jpg`/`.png`, put it in `public/` and update `photo` in the config.

## Deployment (Vercel)
1. Push the repository to GitHub.
2. In [Vercel](https://vercel.com/new), click **Add New → Project** and import `my-wall-react-app`. The framework is detected as Next.js.
3. Under **Environment Variables**, add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` for Production, Preview and Development.
4. Click **Deploy**.
5. Add the production URL to Supabase **Authentication → URL Configuration** (Site URL and Redirect URLs).

Every push to `main` redeploys automatically.

## How guest and member posts work

| | Guest | Member |
|---|---|---|
| Needs an account | No | Yes (optional) |
| `user_id` | `NULL` | `auth.uid()` |
| `author_name` | What the guest typed, or "Guest" | Their profile display name at the moment of posting, set by the database |
| Display name | Changeable; kept for the current tab session only | Changeable; saved to their profile and kept across sessions and devices |
| Renaming affects | Future posts only | Future posts only. Past posts keep their original name, and the user ID never changes |
| Shown as | "Guest" | "Member", or "You" on your own posts |
| My Posts | Not available | Every post, newest first, on any device |

A guest post is **never** linked to an account, even if the same browser later logs in. The guest insert policy only allows `user_id IS NULL`, and the composer only sends a user id for a verified session.

## Security

Row Level Security is enabled on both tables and enforced by the database, not the UI.

| Role | posts | profiles |
|---|---|---|
| `anon` (guest) | SELECT all; INSERT only with `user_id IS NULL` | none |
| `authenticated` | SELECT all; INSERT only with `user_id = auth.uid()` | SELECT / UPDATE (display_name) own row only |
| Everyone | No UPDATE or DELETE on posts (no policy and no grant) | No DELETE |

Additional safeguards:
- `created_at` is always set by the database, so posts can't be back-dated.
- Member `author_name` is overwritten from `profiles`, so a member can't post under another name.
- Length checks are enforced in Postgres as well as in the UI.
- The `?next=` redirect parameter only accepts same-site paths.
- No service-role key exists anywhere in the app.

**Limitations of a public, no-login wall.** Allowing anonymous inserts is a deliberate trade-off:
- Anyone with the public key can post, including scripts. There is no rate limiting or spam/abuse filtering beyond Supabase's platform limits.
- Guests can type any display name, including one that matches a member. The "Guest" / "Member" label shows which is which.
- Posts cannot be edited or deleted from the app, so moderation is done in the Supabase dashboard.

Production hardening options: a CAPTCHA (Supabase supports hCaptcha and Turnstile), inserting through an Edge Function with per-IP rate limits, a profanity filter, and an admin moderation role.

## Manual test checklist
- Guest: open the wall logged out, post, refresh. The post persists and shows as "Guest".
- Validation: empty or whitespace-only posts can't be shared; the counter stops at 280; Share is disabled while saving.
- Realtime: open the wall in two browsers (one in private mode), post in one, and it appears in the other without a refresh.
- Sign up, log in and log out, then refresh. The session state persists.
- Member post: shows "You" and appears under My Posts. Log out and back in, and the history is still there.
- RLS: in the browser console, try inserting a post with someone else's `user_id`. It fails with `42501`.
