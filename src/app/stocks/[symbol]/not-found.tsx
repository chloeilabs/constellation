import Link from "next/link";

export default function StockNotFound() {
  return (
    <div className="mx-auto max-w-xl px-4 py-16 text-center">
      <h1 className="text-2xl font-bold text-header">Stock not found</h1>
      <p className="mt-2 text-sm text-muted">We could not load a quote or company profile for this symbol.</p>
      <Link href="/screener" className="mt-6 inline-block text-link hover:underline">
        Browse the screener
      </Link>
    </div>
  );
}
