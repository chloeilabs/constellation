import Link from "next/link";
import { Container } from "@/components/container";
import { PageHeader } from "@/components/page-header";
import { SymbolTable } from "@/components/symbol-table";
import { getIndustryNames, getScreener, getSectors, withQuoteChanges } from "@/lib/fmp";
import { preferPrimaryListings } from "@/lib/listings";
import { loadIndexMembers, type IndexMemberFilters } from "@/lib/lists";
import type { FmpIndexKey } from "@/lib/indexes";

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

const PAGE_SIZE = 50;

function parseIndex(value?: string): FmpIndexKey | null {
  return value === "sp500" || value === "nasdaq" || value === "dow" ? value : null;
}

export default async function ScreenerPage({
  searchParams,
}: {
  searchParams: Promise<{
    sector?: string;
    industry?: string;
    country?: string;
    exchange?: string;
    type?: string;
    index?: string;
    minCap?: string;
    maxCap?: string;
    minPrice?: string;
    maxPrice?: string;
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
  const index = parseIndex(params.index);
  const minYield = params.minYield ? Number(params.minYield) / 100 : null;
  const query = Object.fromEntries(Object.entries(params).filter(([, value]) => value)) as Record<string, string>;

  let hrefBase: "/stocks" | "/etf" | "/funds" = "/stocks";
  let sectorOptions: string[] = SECTOR_FALLBACK;
  let industryOptions: string[] = [];
  let rows: {
    symbol: string;
    name: string;
    marketCap?: number | null;
    price?: number | null;
    changePercentage?: number | null;
    industry?: string | null;
    volume?: number | null;
    country?: string | null;
    dividendYield?: number | null;
    isEtf?: boolean | null;
    isFund?: boolean | null;
  }[] = [];
  let total = 0;
  let hasNext = false;
  let localCurrency = false;

  if (index) {
    const filters: IndexMemberFilters = {
      sector: params.sector || undefined,
      industry: params.industry || undefined,
      exchange: params.exchange || undefined,
      minCap: params.minCap ? Number(params.minCap) * 1e9 : undefined,
      maxCap: params.maxCap ? Number(params.maxCap) * 1e9 : undefined,
      minPrice: params.minPrice ? Number(params.minPrice) : undefined,
      maxPrice: params.maxPrice ? Number(params.maxPrice) : undefined,
      minVolume: params.minVolume ? Number(params.minVolume) : undefined,
    };
    const members = await loadIndexMembers(index, filters);
    sectorOptions = members.sectors;
    industryOptions = members.industries;
    total = members.rows.length;
    rows = members.rows.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);
    hasNext = (page + 1) * PAGE_SIZE < total;
  } else {
    const filters = {
      country,
      sector: params.sector,
      industry: params.industry,
      exchange: params.exchange,
      marketCapMoreThan: params.minCap ? Number(params.minCap) * 1e9 : undefined,
      marketCapLowerThan: params.maxCap ? Number(params.maxCap) * 1e9 : undefined,
      priceMoreThan: params.minPrice ? Number(params.minPrice) : undefined,
      priceLowerThan: params.maxPrice ? Number(params.maxPrice) : undefined,
      betaMoreThan: params.minBeta ? Number(params.minBeta) : undefined,
      volumeMoreThan: params.minVolume ? Number(params.minVolume) : undefined,
      ...(type === "etf"
        ? { isEtf: true, isFund: false }
        : type === "fund"
          ? { isEtf: false, isFund: true }
          : type === "all"
            ? { isEtf: undefined, isFund: undefined }
            : { isEtf: false, isFund: false }),
    };
    const [screenerRows, sectors, industries] = await Promise.all([
      getScreener(filters, { page, limit: country === "US" && !params.exchange ? 100 : 50 }),
      getSectors(),
      getIndustryNames(),
    ]);
    sectorOptions = sectors.length ? sectors : SECTOR_FALLBACK;
    industryOptions = industries;
    let selected = preferPrimaryListings(screenerRows);
    if (minYield != null && Number.isFinite(minYield) && minYield > 0) {
      selected = selected.filter((row) => {
        const price = row.price;
        const dividend = row.lastAnnualDividend;
        return price > 0 && dividend > 0 && dividend / price >= minYield;
      });
    }
    const sorted = selected.slice(0, PAGE_SIZE);
    const withChanges = await withQuoteChanges(sorted);
    rows = withChanges.map((row) => ({
      symbol: row.symbol,
      name: row.companyName,
      marketCap: row.marketCap,
      price: row.price,
      changePercentage: row.changePercentage,
      industry: row.industry,
      volume: row.volume,
      country: row.country,
      dividendYield: row.price && row.lastAnnualDividend ? row.lastAnnualDividend / row.price : null,
      isEtf: row.isEtf,
      isFund: row.isFund,
    }));
    total = rows.length;
    hasNext = sorted.length >= PAGE_SIZE;
    hrefBase = type === "etf" ? "/etf" : type === "fund" ? "/funds" : "/stocks";
    localCurrency = country !== "US";
  }

  const indexLabel = index === "sp500" ? "S&P 500" : index === "nasdaq" ? "Nasdaq 100" : index === "dow" ? "Dow Jones" : null;

  return (
    <Container>
      <PageHeader
        title={type === "etf" ? "ETF Screener" : type === "fund" ? "Mutual Fund Screener" : "Stock Screener"}
        description={
          indexLabel
            ? `Filter ${indexLabel} constituents by sector, industry, exchange, market cap, price, and volume.`
            : "Filter stocks, ETFs, and funds by country, sector, market cap, price, beta, volume, dividend yield, or U.S. index membership using live FMP data."
        }
      />
      <form className="mb-6 grid gap-3 rounded-lg border border-border bg-muted-bg p-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <label className="text-sm">
          <span className="mb-1 block text-muted">In index</span>
          <select name="index" defaultValue={index ?? ""} className="sa-input">
            <option value="">Any</option>
            <option value="sp500">S&P 500</option>
            <option value="nasdaq">Nasdaq 100</option>
            <option value="dow">Dow Jones</option>
          </select>
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-muted">Country</span>
          <select name="country" defaultValue={country} className="sa-input" disabled={Boolean(index)}>
            <option value="US">United States</option>
            <option value="CA">Canada</option>
            <option value="GB">United Kingdom</option>
            <option value="JP">Japan</option>
            <option value="DE">Germany</option>
            <option value="IN">India</option>
            <option value="FR">France</option>
            <option value="BR">Brazil</option>
            <option value="AU">Australia</option>
            <option value="HK">Hong Kong</option>
            <option value="CN">China</option>
          </select>
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-muted">Type</span>
          <select name="type" defaultValue={type} className="sa-input" disabled={Boolean(index)}>
            <option value="stock">Stocks</option>
            <option value="etf">ETFs</option>
            <option value="fund">Funds</option>
            <option value="all">Stocks, ETFs & Funds</option>
          </select>
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-muted">Sector</span>
          <select name="sector" defaultValue={params.sector ?? ""} className="sa-input">
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
          <select name="industry" defaultValue={params.industry ?? ""} className="sa-input">
            <option value="">All industries</option>
            {industryOptions.map((industry) => (
              <option key={industry} value={industry}>
                {industry}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-muted">Exchange</span>
          <select name="exchange" defaultValue={params.exchange ?? ""} className="sa-input">
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
            className="sa-input"
          />
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-muted">Max market cap ($B)</span>
          <input
            name="maxCap"
            type="number"
            min="0"
            step="1"
            defaultValue={params.maxCap ?? ""}
            className="sa-input"
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
            className="sa-input"
          />
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-muted">Max price</span>
          <input
            name="maxPrice"
            type="number"
            min="0"
            step="0.01"
            defaultValue={params.maxPrice ?? ""}
            className="sa-input"
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
            className="sa-input"
            disabled={Boolean(index)}
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
            className="sa-input"
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
            className="sa-input"
            disabled={Boolean(index)}
          />
        </label>
        <div className="flex flex-wrap items-end gap-2 sm:col-span-2 lg:col-span-3 xl:col-span-2">
          <button type="submit" className="sa-btn sa-btn-primary">
            Apply filters
          </button>
          {Object.keys(query).some((key) => key !== "page") ? (
            <Link href="/screener" className="sa-btn sa-btn-secondary">
              Clear
            </Link>
          ) : null}
        </div>
      </form>
      {index ? (
        <p className="mb-3 text-sm text-muted">
          {indexLabel} constituents from FMP ({total} match{total === 1 ? "" : "es"} after filters). Sector names
          come from the FMP constituent file. Beta and yield filters apply to the company screener only.
        </p>
      ) : (
        <p className="mb-3 text-sm text-muted">{rows.length} results on this page</p>
      )}
      <SymbolTable
        empty="No securities matched these filters."
        hrefBase={hrefBase}
        showYield={Boolean(!index && minYield != null && minYield > 0)}
        localCurrency={localCurrency}
        rows={rows}
      />
      <div className="mt-4 flex gap-2">
        {page > 0 ? (
          <Link
            href={`/screener?${new URLSearchParams({ ...query, page: String(page - 1) })}`}
            className="sa-btn sa-btn-secondary"
          >
            Previous
          </Link>
        ) : null}
        {hasNext ? (
          <Link
            href={`/screener?${new URLSearchParams({ ...query, page: String(page + 1) })}`}
            className="sa-btn sa-btn-secondary"
          >
            Next
          </Link>
        ) : null}
      </div>
    </Container>
  );
}
