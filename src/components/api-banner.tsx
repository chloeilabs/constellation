import Link from "next/link";

export function ApiBanner() {
  return (
    <div
      role="status"
      className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-center text-sm text-amber-950 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-100"
    >
      Add an <span className="font-semibold">FMP_API_KEY</span> environment variable to load live market data from{" "}
      <Link className="underline" href="https://site.financialmodelingprep.com/developer/docs">
        Financial Modeling Prep
      </Link>
      .
    </div>
  );
}
