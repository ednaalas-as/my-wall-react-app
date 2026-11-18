import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AuthListener } from "@/components/AuthListener";
import { TopBar } from "@/components/TopBar";
import { getCurrentUser } from "@/lib/auth";
import { siteName } from "@/lib/site-config";

export const metadata: Metadata = {
  title: { default: siteName, template: `%s | ${siteName}` },
  description:
    "A late-2000s style message wall. Leave a message as a guest, or sign up to keep track of your posts.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#3b5998",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const user = await getCurrentUser();

  return (
    <html lang="en">
      <body className="flex min-h-dvh flex-col">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-10 focus:bg-white focus:px-3 focus:py-2"
        >
          Skip to content
        </a>
        <AuthListener />
        <TopBar user={user} />
        <div className="flex-1">{children}</div>
        <footer className="mx-auto w-full max-w-[980px] border-t border-wall-line px-4 py-4 text-[11px] text-wall-muted">
          {siteName} · a nostalgic wall built with Next.js and Supabase. Not affiliated with any
          social network.
        </footer>
      </body>
    </html>
  );
}
