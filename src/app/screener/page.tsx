import Link from "next/link";
import { Container } from "@/components/container";
import { PageHeader } from "@/components/page-header";
import { SymbolTable } from "@/components/symbol-table";
import { getIndustryNames, getScreener, getSectors, withQuoteChanges } from "@/lib/fmp";
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
    industry?: string;
    country?: string;
    exchange?: string;
    type?: string;
    minCap?: string;
    minPrice?: string;
    minBeta?: string;
    minVolume?: string;
    minYield?: string;
    page?: string;
  }>;
}) {
  const params = await searchParams;
  const page = Number(params.page ?? 0) || 0;
  const country = params.country || "US";
  const type = params.type || "stock";
  const minYield = params.minYield ? Number(params.minYield) / 100 : null;
  const filters = {
    country,
    sector: params.sector,
    industry: params.industry,
    exchange: params.exchange,
    marketCapMoreThan: params.minCap ? Number(params.minCap) * 1e9 : undefined,
    priceMoreThan: params.minPrice ? Number(params.minPrice) : undefined,
    betaMoreThan: params.minBeta ? Number(params.minBeta) : undefined,
    volumeMoreThan: params.minVolume ? Number(params.minVolume) : undefined,
    ...(type === "etf" ? { isEtf: true, isFund: false } : type === "all" ? { isEtf: undefined } : { isEtf: false }),
  };
  const [rows, sectors, industries] = await Promise.all([
    getScreener(filters, { page, limit: country === "US" && !params.exchange ? 100 : 50 }),
    getSectors(),
    getIndustryNames(),
  ]);
  const sectorOptions = sectors.length ? sectors : SECTOR_FALLBACK;
  let selected = preferPrimaryListings(rows);
  if (minYield != null && Number.isFinite(minYield) && minYield > 0) {
    selected = selected.filter((row) => {
      const price = row.price;
      const dividend = row.lastAnnualDividend;
      return price > 0 && dividend > 0 && dividend / price >= minYield;
    });
  }
  const sorted = selected.slice(0, 50);
  const withChanges = await withQuoteChanges(sorted);
  const query = Object.fromEntries(Object.entries(params).filter(([, value]) => value)) as Record<string, string>;

  return (
    <Container>
      <PageHeader
        title="Stock Screener"
        description="Filter stocks and ETFs by country, sector, market cap, beta, volume, and dividend yield using live FMP data."
      />
      <form className="mb-6 grid gap-3 rounded-lg border border-border bg-muted-bg p-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
          <span className="mb-1 block text-muted">Type</span>
          <select name="type" defaultValue={type} className="h-9 w-full rounded-md border border-border bg-white px-2">
            <option value="stock">Stocks</option>
            <option value="etf">ETFs</option>
            <option value="all">Stocks & ETFs</option>
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
          <span className="mb-1 block text-muted">Industry</span>
          <select name="industry" defaultValue={params.industry ?? ""} className="h-9 w-full rounded-md border border-border bg-white px-2">
            <option value="">All industries</option>
            {industries.map((industry) => (
              <option key={industry} value={industry}>
                {industry}
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
        <label className="text-sm">
          <span className="mb-1 block text-muted">Min beta</span>
          <input
            name="minBeta"
            type="number"
            min="0"
            step="0.1"
            defaultValue={params.minBeta ?? ""}
            className="h-9 w-full rounded-md border border-border bg-white px-2"
          />
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-muted">Min volume</span>
          <input
            name="minVolume"
            type="number"
            min="0"
            step="1000"
            defaultValue={params.minVolume ?? ""}
            className="h-9 w-full rounded-md border border-border bg-white px-2"
          />
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-muted">Min yield (%)</span>
          <input
            name="minYield"
            type="number"
            min="0"
            step="0.1"
            defaultValue={params.minYield ?? ""}
            className="h-9 w-full rounded-md border border-border bg-white px-2"
          />
        </label>
        <div className="flex items-end sm:col-span-2 lg:col-span-3 xl:col-span-2">
          <button type="submit" className="rounded-md bg-header px-4 py-2 text-sm font-medium text-white">
            Apply filters
          </button>
        </div>
      </form>
      <p className="mb-3 text-sm text-muted">{withChanges.length} results on this page</p>
      <SymbolTable
        empty="No securities matched these filters."
        hrefBase={type === "etf" ? "/etf" : "/stocks"}
        showYield={minYield != null && minYield > 0}
        rows={withChanges.map((row) => ({
          symbol: row.symbol,
          name: row.companyName,
          marketCap: row.marketCap,
          price: row.price,
          changePercentage: row.changePercentage,
          industry: row.industry,
          volume: row.volume,
          dividendYield: row.price && row.lastAnnualDividend ? row.lastAnnualDividend / row.price : null,
        }))}
      />
      <div className="mt-4 flex gap-3 text-sm">
        {page > 0 ? (
          <Link
            href={`/screener?${new URLSearchParams({ ...query, page: String(page - 1) })}`}
            className="text-link hover:underline"
          >
            Previous
          </Link>
        ) : null}
        {sorted.length >= 50 ? (
          <Link
            href={`/screener?${new URLSearchParams({ ...query, page: String(page + 1) })}`}
            className="text-link hover:underline"
          >
            Next
          </Link>
        ) : null}
      </div>
    </Container>
  );
}
