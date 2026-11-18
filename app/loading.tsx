export default function Loading() {
  return (
    <div
      className="mx-auto grid w-full max-w-[980px] gap-6 px-4 py-5 md:grid-cols-[200px_minmax(0,1fr)]"
      aria-busy="true"
    >
      <div className="hidden h-60 animate-pulse bg-wall-pale md:block" />
      <div className="space-y-3">
        <p className="sr-only" role="status">
          Loading the wall…
        </p>
        <div className="h-6 w-48 animate-pulse bg-wall-pale" />
        <div className="h-24 animate-pulse border border-wall-line bg-wall-pale" />
        {[0, 1, 2].map((row) => (
          <div key={row} className="flex gap-3 border-b border-wall-rule py-3">
            <div className="h-[50px] w-[50px] animate-pulse bg-wall-pale" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-32 animate-pulse bg-wall-pale" />
              <div className="h-3 w-3/4 animate-pulse bg-wall-pale" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
