export default function Loading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <div className="h-8 w-48 animate-pulse rounded bg-muted-bg" />
      <div className="mt-6 h-64 animate-pulse rounded-lg bg-muted-bg" />
      <div className="mt-6 h-40 animate-pulse rounded-lg bg-muted-bg" />
    </div>
  );
}
