import Link from "next/link";
import type { CurrentUser } from "@/types/database";
import { LogoutButton } from "./LogoutButton";
import { GuestNameEditor, MemberNameEditor } from "./NameEditor";
import { ProfilePhoto } from "./ProfilePhoto";

const memberSinceFormat = new Intl.DateTimeFormat("en-US", {
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

/** Photo and information for whoever is viewing: a member or a guest. */
export function ProfileCard({ user }: { user: CurrentUser | null }) {
  return (
    <aside aria-label="Your profile">
      <div className="flex gap-4 md:block">
        <ProfilePhoto user={user} />

        <section className="min-w-0 flex-1 md:mt-4" aria-labelledby="info-heading">
          <h2 id="info-heading" className="box-title">
            Information
          </h2>
          <dl className="space-y-1.5 px-2 py-2 text-[12px]">
            <div>
              <dt className="text-wall-muted">Name:</dt>
              <dd>
                {user ? (
                  <MemberNameEditor
                    // Remount after a rename so the editor shows the saved name.
                    key={user.displayName}
                    userId={user.id}
                    displayName={user.displayName}
                  />
                ) : (
                  <GuestNameEditor />
                )}
              </dd>
            </div>
            {user ? (
              <>
                {user.email && (
                  <div>
                    <dt className="text-wall-muted">Email:</dt>
                    <dd className="break-all">{user.email}</dd>
                  </div>
                )}
                {user.memberSince && (
                  <div>
                    <dt className="text-wall-muted">Member since:</dt>
                    <dd>{memberSinceFormat.format(new Date(user.memberSince))}</dd>
                  </div>
                )}
              </>
            ) : (
              <div>
                <dt className="text-wall-muted">Status:</dt>
                <dd>Guest</dd>
              </div>
            )}
          </dl>
        </section>
      </div>
    </aside>
  );
}

export function AccountBox({ user }: { user: CurrentUser | null }) {
  return (
    <aside aria-labelledby="account-heading">
      <h2 id="account-heading" className="box-title">
        {user ? "Your Account" : "Keep Track of Your Posts"}
      </h2>
      {user ? (
        <div className="space-y-2 px-2 py-2 text-[12px]">
          <p>Your name and photo are saved to your account, on every device.</p>
          <p className="flex flex-wrap gap-x-3">
            <Link href="/my-posts" className="font-bold">
              My Posts
            </Link>
            <LogoutButton className="cursor-pointer text-wall-link hover:underline" />
          </p>
        </div>
      ) : (
        <div className="space-y-2 px-2 py-2 text-[12px]">
          <p>
            You&apos;re posting as a guest. No account needed — just write and share.
          </p>
          <p className="text-wall-muted">
            Sign up for free to keep your name and photo, and see every post you&apos;ve
            written, on any device.
          </p>
          <p className="flex flex-wrap gap-2 pt-1">
            <Link href="/register" className="btn-wall hover:no-underline">
              Sign up
            </Link>
            <Link href="/login" className="btn-plain hover:no-underline">
              Log in
            </Link>
          </p>
        </div>
      )}
    </aside>
  );
}
