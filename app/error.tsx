"use client";

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <div className="border border-wall-error bg-wall-error-bg p-4" role="alert">
        <h1 className="font-bold">Something went wrong</h1>
        <p className="mt-1">The wall couldn&apos;t be loaded. Please try again.</p>
        <button type="button" onClick={reset} className="btn-wall mt-3">
          Try again
        </button>
      </div>
    </div>
  );
}
