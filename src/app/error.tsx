"use client";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto max-w-xl px-4 py-16 text-center">
      <h1 className="text-2xl font-bold text-header">Something went wrong</h1>
      <p className="mt-2 text-sm text-muted">{error.message || "An unexpected error occurred."}</p>
      <button
        type="button"
        onClick={reset}
        className="mt-6 rounded-md bg-header px-4 py-2 text-sm font-medium text-on-header"
      >
        Try again
      </button>
    </div>
  );
}
