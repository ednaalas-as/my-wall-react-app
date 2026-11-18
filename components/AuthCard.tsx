import type { ReactNode } from "react";

export function AuthCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <main id="main" className="mx-auto w-full max-w-[420px] px-4 py-8">
      <section className="border border-wall-border" aria-labelledby="auth-title">
        <h1 id="auth-title" className="bg-wall-blue px-3 py-2 text-[14px] font-bold text-white">
          {title}
        </h1>
        <div className="bg-wall-panel p-4">{children}</div>
      </section>
    </main>
  );
}
