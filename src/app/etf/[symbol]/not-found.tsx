import Link from "next/link";

export default function EtfNotFound() {
  return (
    <div className="mx-auto max-w-lg px-4 py-20 text-center">
      <h1 className="text-2xl font-bold text-header">ETF not found</h1>
      <p className="mt-2 text-sm text-muted">We could not load this ticker from Financial Modeling Prep.</p>
      <p className="mt-4">
        <Link href="/etf" className="text-link hover:underline">
          Back to ETF list
        </Link>
      </p>
    </div>
  );
}
