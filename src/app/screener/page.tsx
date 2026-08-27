import Link from "next/link";
import { Container } from "@/components/container";
import { PageHeader } from "@/components/page-header";
import { SymbolTable } from "@/components/symbol-table";
import { getScreener, getSectors, withQuoteChanges } from "@/lib/fmp";
import { preferPrimaryListings } from "@/lib/listings";

const SECTOR_FALLBACK = [
  "Technology",
  "Healthcare",
  "Financial Services",
  "Consumer Cyclical",
  "Communication Services",
  "Industrials",
  "Consumer Defensive",
  "Energy",
  "Basic Materials",
  "Real Estate",
  "Utilities",
];

export default async function ScreenerPage({
  searchParams,
}: {
  searchParams: Promise<{
    sector?: string;
    country?: string;
    exchange?: string;
    minCap?: string;
    minPrice?: string;
    page?: string;
  }>;
}) {
  const params = await searchParams;
  const page = Number(params.page ?? 0) || 0;
  const country = params.country || "US";
  const filters = {
    country,
    sector: params.sector,
    exchange: params.exchange,
    marketCapMoreThan: params.minCap ? Number(params.minCap) * 1e9 : undefined,
    priceMoreThan: params.minPrice ? Number(params.minPrice) : undefined,
  };
  const [rows, sectors] = await Promise.all([
    getScreener(filters, { page, limit: country === "US" && !params.exchange ? 100 : 50 }),
    getSectors(),
  ]);
  const sectorOptions = sectors.length ? sectors : SECTOR_FALLBACK;
  const sorted = preferPrimaryListings(rows).slice(0, 50);
  const withChanges = await withQuoteChanges(sorted);

  return (
    <Container>
      <PageHeader
        title="Stock Screener"
        description="Filter stocks by country, sector, market cap, and price using FMP data."
      />
      <form className="mb-6 grid gap-3 rounded-lg border border-border bg-muted-bg p-4 sm:grid-cols-2 lg:grid-cols-5">
        <label className="text-sm">
          <span className="mb-1 block text-muted">Country</span>
          <select name="country" defaultValue={country} className="h-9 w-full rounded-md border border-border bg-white px-2">
            <option value="US">United States</option>
            <option value="CA">Canada</option>
            <option value="GB">United Kingdom</option>
            <option value="JP">Japan</option>
            <option value="DE">Germany</option>
          </select>
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-muted">Sector</span>
          <select name="sector" defaultValue={params.sector ?? ""} className="h-9 w-full rounded-md border border-border bg-white px-2">
            <option value="">All sectors</option>
            {sectorOptions.map((sector) => (
              <option key={sector} value={sector}>
                {sector}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-muted">Exchange</span>
          <select name="exchange" defaultValue={params.exchange ?? ""} className="h-9 w-full rounded-md border border-border bg-white px-2">
            <option value="">All</option>
            <option value="NASDAQ">NASDAQ</option>
            <option value="NYSE">NYSE</option>
            <option value="AMEX">AMEX</option>
          </select>
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-muted">Min market cap ($B)</span>
          <input
            name="minCap"
            type="number"
            min="0"
            step="1"
            defaultValue={params.minCap ?? ""}
            className="h-9 w-full rounded-md border border-border bg-white px-2"
          />
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-muted">Min price</span>
          <input
            name="minPrice"
            type="number"
            min="0"
            step="0.01"
            defaultValue={params.minPrice ?? ""}
            className="h-9 w-full rounded-md border border-border bg-white px-2"
          />
        </label>
        <div className="sm:col-span-2 lg:col-span-5">
          <button type="submit" className="rounded-md bg-header px-4 py-2 text-sm font-medium text-white">
            Apply filters
          </button>
        </div>
      </form>
      <p className="mb-3 text-sm text-muted">{withChanges.length} stocks on this page</p>
      <SymbolTable
        empty="No stocks matched these filters."
        rows={withChanges.map((row) => ({
          symbol: row.symbol,
          name: row.companyName,
          marketCap: row.marketCap,
          price: row.price,
          changePercentage: row.changePercentage,
          industry: row.industry,
          volume: row.volume,
        }))}
      />
      <div className="mt-4 flex gap-3 text-sm">
        {page > 0 ? (
          <Link
            href={`/screener?${new URLSearchParams({ ...params, page: String(page - 1) } as Record<string, string>)}`}
            className="text-link hover:underline"
          >
            Previous
          </Link>
        ) : null}
        {sorted.length >= 50 ? (
          <Link
            href={`/screener?${new URLSearchParams({ ...Object.fromEntries(Object.entries(params).filter(([, v]) => v)), page: String(page + 1) })}`}
            className="text-link hover:underline"
          >
            Next
          </Link>
        ) : null}
      </div>
    </Container>
  );
}
