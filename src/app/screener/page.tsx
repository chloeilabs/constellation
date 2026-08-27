import Link from "next/link";
import { Container } from "@/components/container";
import { PageHeader } from "@/components/page-header";
import { formatCompactUsd, formatInteger, formatPrice, formatRatio } from "@/lib/format";
import { getScreener, getSectors } from "@/lib/fmp";

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
    getScreener(filters, { page, limit: 50 }),
    getSectors(),
  ]);
  const sectorOptions = sectors.length ? sectors : SECTOR_FALLBACK;
  const sorted = [...rows].sort((a, b) => (b.marketCap ?? 0) - (a.marketCap ?? 0));

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
      <p className="mb-3 text-sm text-muted">{sorted.length} stocks on this page</p>
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="sa-table">
          <thead>
            <tr>
              <th>Symbol</th>
              <th>Company Name</th>
              <th className="num">Market Cap</th>
              <th className="num">Price</th>
              <th>Industry</th>
              <th className="num">Volume</th>
              <th className="num">Beta</th>
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-muted">
                  No stocks matched these filters.
                </td>
              </tr>
            ) : (
              sorted.map((row) => (
                <tr key={row.symbol}>
                  <td className="symbol">
                    <Link href={`/stocks/${row.symbol}`} className="text-link hover:underline">
                      {row.symbol}
                    </Link>
                  </td>
                  <td>{row.companyName}</td>
                  <td className="num">{formatCompactUsd(row.marketCap)}</td>
                  <td className="num">{formatPrice(row.price)}</td>
                  <td className="text-muted">{row.industry}</td>
                  <td className="num">{formatInteger(row.volume)}</td>
                  <td className="num">{formatRatio(row.beta)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
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
