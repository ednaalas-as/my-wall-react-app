import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthCard } from "@/components/AuthCard";
import { AuthForm } from "@/components/AuthForm";
import { getCurrentUser } from "@/lib/auth";
import { safeNextPath } from "@/lib/redirect";
import { siteName } from "@/lib/site-config";

export const metadata: Metadata = { title: "Log in" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const params = await searchParams;
  const next = safeNextPath(typeof params.next === "string" ? params.next : null, "/my-posts");
  if (await getCurrentUser()) redirect(next);

  const confirmFailed = params.error === "confirmation";

  return (
    <AuthCard title={`Log in to ${siteName}`}>
      {confirmFailed && (
        <p role="alert" className="mb-3 border border-wall-error bg-wall-error-bg px-2 py-1.5 text-[12px]">
          That confirmation link is invalid or has expired. Try logging in, or sign up again.
        </p>
      )}
      <AuthForm mode="login" next={next} />
    </AuthCard>
  );
}
