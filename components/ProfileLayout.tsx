import Link from "next/link";
import type { ReactNode } from "react";
import { wallOwner } from "@/lib/site-config";
import type { CurrentUser } from "@/types/database";
import { AccountBox, ProfileCard } from "./ProfileSidebar";

type Tab = "wall" | "my-posts";

export function ProfileLayout({
  user,
  activeTab,
  children,
}: {
  user: CurrentUser | null;
  activeTab: Tab;
  children: ReactNode;
}) {
  const tabs: { id: Tab; label: string; href: string }[] = [
    { id: "wall", label: "Wall", href: "/" },
    ...(user ? [{ id: "my-posts" as const, label: "My Posts", href: "/my-posts" }] : []),
  ];

  return (
    // Desktop: profile and account stacked on the left, wall on the right.
    // Mobile: profile, then the wall, then the account box.
    <div className="mx-auto grid w-full max-w-[980px] gap-6 px-4 py-5 md:grid-cols-[200px_minmax(0,1fr)] md:grid-rows-[auto_1fr]">
      <div className="md:col-start-1 md:row-start-1">
        <ProfileCard />
      </div>

      <main id="main" className="min-w-0 md:col-start-2 md:row-span-2 md:row-start-1">
        <div className="border-b border-wall-line pb-3">
          <h1 className="text-[20px] font-bold leading-tight text-wall-text">{wallOwner.name}</h1>
          <p className="mt-1 text-[13px]">
            <span className="font-bold">{wallOwner.name}</span> {wallOwner.status}
          </p>
        </div>

        <nav aria-label="Profile sections" className="mt-3 flex gap-1 border-b border-wall-border">
          {tabs.map((tab) => {
            const active = tab.id === activeTab;
            return (
              <Link
                key={tab.id}
                href={tab.href}
                aria-current={active ? "page" : undefined}
                className={`-mb-px border px-3 py-1.5 text-[12px] font-bold hover:no-underline ${
                  active
                    ? "border-wall-border border-b-white bg-white text-wall-text"
                    : "border-transparent bg-wall-pale text-wall-link hover:bg-wall-line"
                }`}
              >
                {tab.label}
              </Link>
            );
          })}
        </nav>

        <div className="pt-4">{children}</div>
      </main>

      <div className="md:col-start-1 md:row-start-2">
        <AccountBox user={user} />
      </div>
    </div>
  );
}
