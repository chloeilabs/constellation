import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-xl px-4 py-16 text-center">
      <h1 className="text-2xl font-bold text-header">Page not found</h1>
      <p className="mt-2 text-sm text-muted">The page you requested does not exist.</p>
      <Link href="/" className="mt-6 inline-block text-link hover:underline">
        Back to home
      </Link>
    </div>
  );
}
