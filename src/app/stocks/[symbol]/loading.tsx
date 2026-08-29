export default function StockLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8" aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading quote</span>
      <div className="flex items-start gap-4">
        <div className="h-12 w-12 animate-pulse rounded-md bg-muted-bg" />
        <div className="min-w-0 flex-1">
          <div className="h-9 w-80 max-w-full animate-pulse rounded bg-muted-bg" />
          <div className="mt-3 h-5 w-56 max-w-full animate-pulse rounded bg-muted-bg" />
          <div className="mt-4 h-10 w-40 animate-pulse rounded bg-muted-bg" />
        </div>
      </div>
      <div className="mt-6 flex gap-3 overflow-hidden">
        {Array.from({ length: 8 }, (_, index) => (
          <div key={index} className="h-9 w-20 shrink-0 animate-pulse rounded bg-muted-bg" />
        ))}
      </div>
      <div className="mt-8 h-72 animate-pulse rounded-lg bg-muted-bg" />
      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        {Array.from({ length: 3 }, (_, index) => (
          <div key={index} className="h-40 animate-pulse rounded-lg bg-muted-bg" />
        ))}
      </div>
    </div>
  );
}
