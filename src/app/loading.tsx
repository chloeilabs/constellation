export default function Loading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10" aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading</span>
      <div className="h-10 w-72 max-w-full animate-pulse rounded-lg bg-muted-bg" />
      <div className="mt-4 h-5 w-96 max-w-full animate-pulse rounded bg-muted-bg" />
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className="h-24 animate-pulse rounded-lg bg-muted-bg" />
        ))}
      </div>
      <div className="mt-8 h-72 animate-pulse rounded-lg bg-muted-bg" />
      <div className="mt-6 h-48 animate-pulse rounded-lg bg-muted-bg" />
    </div>
  );
}
