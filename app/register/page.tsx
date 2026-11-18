import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthCard } from "@/components/AuthCard";
import { AuthForm } from "@/components/AuthForm";
import { getCurrentUser } from "@/lib/auth";
import { safeNextPath } from "@/lib/redirect";
import { siteName } from "@/lib/site-config";

export const metadata: Metadata = { title: "Sign up" };

export default async function RegisterPage({ searchParams }: PageProps<"/register">) {
  const params = await searchParams;
  const next = safeNextPath(typeof params.next === "string" ? params.next : null, "/my-posts");
  if (await getCurrentUser()) redirect(next);

  return (
    <AuthCard title={`Sign up for ${siteName}`}>
      <p className="mb-3 text-[12px]">
        Create a free account to keep a history of everything you post, on any device.
      </p>
      <AuthForm mode="register" next={next} />
    </AuthCard>
  );
}
