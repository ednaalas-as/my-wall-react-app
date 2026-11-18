import Link from "next/link";
import { siteName } from "@/lib/site-config";
import type { CurrentUser } from "@/types/database";
import { LogoutButton } from "./LogoutButton";

const navLink = "px-2 py-2 text-[12px] font-bold text-white hover:bg-wall-navy hover:no-underline";

export function TopBar({ user }: { user: CurrentUser | null }) {
  return (
    <header className="bg-wall-blue">
      <nav
        aria-label="Main"
        className="mx-auto flex min-h-10 max-w-[980px] flex-wrap items-center gap-x-1 px-4"
      >
        <Link
          href="/"
          className="mr-auto py-1.5 text-[17px] font-bold tracking-tight text-white hover:no-underline sm:text-[22px]"
        >
          {siteName}
        </Link>
        <Link href="/" className={navLink}>
          Wall
        </Link>
        {user ? (
          <>
            <Link href="/my-posts" className={navLink}>
              My Posts
            </Link>
            <span className="hidden px-2 text-[12px] text-[#d8dfea] sm:inline">
              {user.displayName}
            </span>
            <LogoutButton className={`${navLink} cursor-pointer`} />
          </>
        ) : (
          <>
            <Link href="/login" className={navLink}>
              Log in
            </Link>
            <Link href="/register" className={navLink}>
              Sign up
            </Link>
          </>
        )}
      </nav>
    </header>
  );
}
