import Image from "next/image";
import Link from "next/link";
import { wallOwner } from "@/lib/site-config";
import type { CurrentUser } from "@/types/database";
import { LogoutButton } from "./LogoutButton";

const memberSinceFormat = new Intl.DateTimeFormat("en-US", {
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

export function ProfileCard() {
  return (
    <aside aria-label="Profile">
      <div className="flex gap-4 md:block">
        <Image
          src={wallOwner.photo}
          alt={`Profile photo of ${wallOwner.name}`}
          width={200}
          height={240}
          priority
          unoptimized
          className="h-auto w-28 shrink-0 border border-wall-border sm:w-36 md:w-full"
        />

        <section className="min-w-0 flex-1 md:mt-4" aria-labelledby="info-heading">
          <h2 id="info-heading" className="box-title">
            Information
          </h2>
          <dl className="space-y-1.5 px-2 py-2 text-[12px]">
            {wallOwner.info.map((item) => (
              <div key={item.label}>
                <dt className="text-wall-muted">{item.label}:</dt>
                <dd>{item.value}</dd>
              </div>
            ))}
          </dl>
        </section>
      </div>
    </aside>
  );
}

export function AccountBox({ user }: { user: CurrentUser | null }) {
  return (
    <aside aria-labelledby="account-heading">
      <section>
        <h2 id="account-heading" className="box-title">
          {user ? "Your Account" : "Keep Track of Your Posts"}
        </h2>
        {user ? (
          <div className="space-y-2 px-2 py-2 text-[12px]">
            <p>
              Logged in as <span className="font-bold">{user.displayName}</span>
            </p>
            {user.email && <p className="break-all text-wall-muted">{user.email}</p>}
            {user.memberSince && (
              <p className="text-wall-muted">
                Member since {memberSinceFormat.format(new Date(user.memberSince))}
              </p>
            )}
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
              Sign up for free to see every post you&apos;ve written, on any device.
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
      </section>
    </aside>
  );
}
