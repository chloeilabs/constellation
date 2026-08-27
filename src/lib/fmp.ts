import { connection } from "next/server";
import { chunk, first } from "@/lib/utils";
import type {
  FmpAftermarketQuote,
  FmpBalanceSheet,
  FmpCashFlow,
  FmpDividend,
  FmpEarnings,
  FmpEconomicEvent,
  FmpEstimate,
  FmpEtfHolding,
  FmpEtfInfo,
  FmpEtfSector,
  FmpExecutive,
  FmpFullCandle,
  FmpGrade,
  FmpGradesConsensus,
  FmpHistoricalMarketCap,
  FmpIncomeGrowth,
  FmpIncomeStatement,
  FmpIndexConstituent,
  FmpInsiderTrade,
  FmpIntradayCandle,
  FmpIpo,
  FmpKeyMetricsTtm,
  FmpLightCandle,
  FmpMarketHours,
  FmpMover,
  FmpNewsItem,
  FmpPeer,
  FmpPriceChange,
  FmpPriceTarget,
  FmpProfile,
  FmpQuote,
  FmpRatings,
  FmpRatios,
  FmpRatiosTtm,
  FmpScores,
  FmpScreenerRow,
  FmpSearchResult,
  FmpSectorPerformance,
  FmpShareFloat,
  FmpSplit,
  FmpSecFiling,
  FmpTranscript,
  FmpTranscriptDate,
  FmpInstitutionalSummary,
  FmpInstitutionalHolder,
  FmpEmployeeCount,
  FmpDcf,
  FmpRevenueSegment,
  FmpIndustryPerformance,
  FmpIndustryPe,
  FmpMerger,
  FmpIpoDisclosure,
  FmpIpoProspectus,
  StatementPeriod,
} from "@/lib/types";
import { recentFiscalQuarters } from "@/lib/utils";

const FMP_BASE = "https://financialmodelingprep.com/stable";

export class FmpError extends Error {
  constructor(
    message: string,
    public status = 500,
  ) {
    super(message);
    this.name = "FmpError";
  }
}

export function hasFmpKey() {
  return Boolean(process.env.FMP_API_KEY?.trim());
}

type QueryValue = string | number | boolean | undefined;

export async function fmpGet<T>(
  path: string,
  params: Record<string, QueryValue> = {},
  { revalidate = 60 }: { revalidate?: number } = {},
): Promise<T> {
  await connection();
  const key = process.env.FMP_API_KEY?.trim();
  if (!key) {
    throw new FmpError(
      "Missing FMP_API_KEY. Add a Financial Modeling Prep API key to load live market data.",
      401,
    );
  }

  const url = new URL(`${FMP_BASE}${path.startsWith("/") ? path : `/${path}`}`);
  for (const [name, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") {
      url.searchParams.set(name, String(value));
    }
  }
  url.searchParams.set("apikey", key);

  const response = await fetch(url.toString(), {
    headers: { Accept: "application/json" },
    next: { revalidate },
  });

  const raw = await response.text();
  let data: unknown = null;
  if (raw) {
    try {
      data = JSON.parse(raw);
    } catch {
      throw new FmpError(`FMP returned a non-JSON response (${response.status}).`, response.status);
    }
  }

  if (!response.ok) {
    const message =
      typeof data === "object" &&
      data &&
      "Error Message" in data &&
      typeof (data as { "Error Message": unknown })["Error Message"] === "string"
        ? (data as { "Error Message": string })["Error Message"]
        : `FMP request failed (${response.status}).`;
    throw new FmpError(message, response.status);
  }

  if (
    typeof data === "object" &&
    data &&
    "Error Message" in data &&
    typeof (data as { "Error Message": unknown })["Error Message"] === "string"
  ) {
    throw new FmpError((data as { "Error Message": string })["Error Message"], 400);
  }

  return data as T;
}

export async function fmpList<T>(
  path: string,
  params: Record<string, QueryValue> = {},
  options?: { revalidate?: number },
): Promise<T[]> {
  try {
    const data = await fmpGet<T[] | T>(path, params, options);
    return Array.isArray(data) ? data : data ? [data] : [];
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "digest" in error &&
      (error as { digest?: string }).digest === "DYNAMIC_SERVER_USAGE"
    ) {
      throw error;
    }
    if (error instanceof FmpError && error.status === 401) return [];
    console.error(`FMP ${path} failed`, error);
    return [];
  }
}

export async function fmpFirst<T>(
  path: string,
  params: Record<string, QueryValue> = {},
  options?: { revalidate?: number },
): Promise<T | null> {
  return first(await fmpList<T>(path, params, options));
}

export function getQuote(symbol: string) {
  return fmpFirst<FmpQuote>("/quote", { symbol: symbol.toUpperCase() }, { revalidate: 30 });
}

export async function getQuotes(symbols: string[]) {
  const unique = [...new Set(symbols.map((symbol) => symbol.toUpperCase()).filter(Boolean))];
  if (unique.length === 0) return [] as FmpQuote[];
  const groups = await Promise.all(
    chunk(unique, 80).map((group) =>
      fmpList<FmpQuote>("/batch-quote", { symbols: group.join(",") }, { revalidate: 30 }),
    ),
  );
  return groups.flat();
}

export function getProfile(symbol: string) {
  return fmpFirst<FmpProfile>("/profile", { symbol: symbol.toUpperCase() }, { revalidate: 3600 });
}

export function searchSymbol(query: string, limit = 10) {
  return fmpList<FmpSearchResult>(
    "/search-symbol",
    { query, limit },
    { revalidate: 120 },
  );
}

export function searchName(query: string, limit = 10) {
  return fmpList<FmpSearchResult>("/search-name", { query, limit }, { revalidate: 120 });
}

export async function searchAll(query: string, limit = 8) {
  const trimmed = query.trim();
  if (!trimmed) return [] as FmpSearchResult[];
  const [bySymbol, byName] = await Promise.all([
    searchSymbol(trimmed, Math.max(limit, 12)),
    searchName(trimmed, Math.max(limit, 12)),
  ]);
  const seen = new Set<string>();
  const merged: FmpSearchResult[] = [];
  for (const item of [...bySymbol, ...byName]) {
    if (!item.symbol) continue;
    const key = `${item.symbol}-${item.exchange}`;
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push(item);
  }
  const needle = trimmed.toUpperCase();
  const usExchange = /NASDAQ|NYSE|AMEX|NYSEARCA|BATS|CBOE/i;
  merged.sort((a, b) => {
    const score = (item: FmpSearchResult) => {
      const symbol = item.symbol.toUpperCase();
      const exact = symbol === needle ? 0 : 1;
      const us = usExchange.test(item.exchange) || usExchange.test(item.exchangeFullName) ? 0 : 1;
      const prefix = symbol.startsWith(needle) ? 0 : 1;
      return [exact, us, prefix, symbol.length] as const;
    };
    const left = score(a);
    const right = score(b);
    for (let i = 0; i < left.length; i++) {
      if (left[i] !== right[i]) return left[i] - right[i];
    }
    return a.symbol.localeCompare(b.symbol);
  });
  return merged.slice(0, limit);
}

export function getGainers() {
  return fmpList<FmpMover>("/biggest-gainers", {}, { revalidate: 60 });
}

export function getLosers() {
  return fmpList<FmpMover>("/biggest-losers", {}, { revalidate: 60 });
}

export function getMostActive() {
  return fmpList<FmpMover>("/most-actives", {}, { revalidate: 60 });
}

export function getStockNews(limit = 20, page = 0) {
  return fmpList<FmpNewsItem>(
    "/news/stock-latest",
    { limit, page },
    { revalidate: 120 },
  );
}

export function getSymbolNews(symbol: string, limit = 20) {
  return fmpList<FmpNewsItem>(
    "/news/stock",
    { symbols: symbol.toUpperCase(), limit },
    { revalidate: 120 },
  );
}

export function getPressReleases(symbol: string, limit = 10) {
  return fmpList<FmpNewsItem>(
    "/news/press-releases",
    { symbols: symbol.toUpperCase(), limit },
    { revalidate: 300 },
  );
}

export function getIpos(from: string, to: string) {
  return fmpList<FmpIpo>("/ipos-calendar", { from, to }, { revalidate: 600 });
}

export function getEarningsCalendar(from: string, to: string) {
  return fmpList<FmpEarnings>("/earnings-calendar", { from, to }, { revalidate: 300 });
}

export function getCompanyEarnings(symbol: string, limit = 12) {
  return fmpList<FmpEarnings>(
    "/earnings",
    { symbol: symbol.toUpperCase(), limit },
    { revalidate: 3600 },
  );
}

export function getDividends(symbol: string, limit = 40) {
  return fmpList<FmpDividend>(
    "/dividends",
    { symbol: symbol.toUpperCase(), limit },
    { revalidate: 3600 },
  );
}

export function getDividendCalendar(from: string, to: string) {
  return fmpList<FmpDividend>("/dividends-calendar", { from, to }, { revalidate: 600 });
}

export function getPriceChange(symbol: string) {
  return fmpFirst<FmpPriceChange>(
    "/stock-price-change",
    { symbol: symbol.toUpperCase() },
    { revalidate: 120 },
  );
}

export function getAftermarketQuote(symbol: string) {
  return fmpFirst<FmpAftermarketQuote>(
    "/aftermarket-quote",
    { symbol: symbol.toUpperCase() },
    { revalidate: 15 },
  );
}

export function getDailyChart(symbol: string, from?: string, to?: string) {
  return fmpList<FmpLightCandle>(
    "/historical-price-eod/light",
    { symbol: symbol.toUpperCase(), from, to },
    { revalidate: 300 },
  );
}

export function getIntradayChart(symbol: string, interval: "1min" | "5min" | "15min" | "1hour") {
  return fmpList<FmpIntradayCandle>(
    `/historical-chart/${interval}`,
    { symbol: symbol.toUpperCase() },
    { revalidate: 30 },
  );
}

export function getIncomeStatements(symbol: string, period: StatementPeriod, limit = 8) {
  return fmpList<FmpIncomeStatement>(
    "/income-statement",
    { symbol: symbol.toUpperCase(), period, limit },
    { revalidate: 3600 },
  );
}

export function getIncomeTtm(symbol: string) {
  return fmpFirst<FmpIncomeStatement>(
    "/income-statement-ttm",
    { symbol: symbol.toUpperCase() },
    { revalidate: 3600 },
  );
}

export function getBalanceSheets(symbol: string, period: StatementPeriod, limit = 8) {
  return fmpList<FmpBalanceSheet>(
    "/balance-sheet-statement",
    { symbol: symbol.toUpperCase(), period, limit },
    { revalidate: 3600 },
  );
}

export function getCashFlows(symbol: string, period: StatementPeriod, limit = 8) {
  return fmpList<FmpCashFlow>(
    "/cash-flow-statement",
    { symbol: symbol.toUpperCase(), period, limit },
    { revalidate: 3600 },
  );
}

export function getCashFlowTtm(symbol: string) {
  return fmpFirst<FmpCashFlow>(
    "/cash-flow-statement-ttm",
    { symbol: symbol.toUpperCase() },
    { revalidate: 3600 },
  );
}

export function getRatios(symbol: string, period: StatementPeriod, limit = 8) {
  return fmpList<FmpRatios>(
    "/ratios",
    { symbol: symbol.toUpperCase(), period, limit },
    { revalidate: 3600 },
  );
}

export function getRatiosTtm(symbol: string) {
  return fmpFirst<FmpRatiosTtm>(
    "/ratios-ttm",
    { symbol: symbol.toUpperCase() },
    { revalidate: 3600 },
  );
}

export function getKeyMetricsTtm(symbol: string) {
  return fmpFirst<FmpKeyMetricsTtm>(
    "/key-metrics-ttm",
    { symbol: symbol.toUpperCase() },
    { revalidate: 3600 },
  );
}

export function getKeyMetrics(symbol: string, period: StatementPeriod, limit = 8) {
  return fmpList<Record<string, string | number>>(
    "/key-metrics",
    { symbol: symbol.toUpperCase(), period, limit },
    { revalidate: 3600 },
  );
}

export function getPriceTarget(symbol: string) {
  return fmpFirst<FmpPriceTarget>(
    "/price-target-consensus",
    { symbol: symbol.toUpperCase() },
    { revalidate: 3600 },
  );
}

export function getGradesConsensus(symbol: string) {
  return fmpFirst<FmpGradesConsensus>(
    "/grades-consensus",
    { symbol: symbol.toUpperCase() },
    { revalidate: 3600 },
  );
}

export function getGrades(symbol: string, limit = 12) {
  return fmpList<FmpGrade>(
    "/grades",
    { symbol: symbol.toUpperCase(), limit },
    { revalidate: 3600 },
  );
}

export function getRatings(symbol: string) {
  return fmpFirst<FmpRatings>(
    "/ratings-snapshot",
    { symbol: symbol.toUpperCase() },
    { revalidate: 3600 },
  );
}

export function getScores(symbol: string) {
  return fmpFirst<FmpScores>(
    "/financial-scores",
    { symbol: symbol.toUpperCase() },
    { revalidate: 3600 },
  );
}

export function getPeers(symbol: string) {
  return fmpList<FmpPeer>(
    "/stock-peers",
    { symbol: symbol.toUpperCase() },
    { revalidate: 3600 },
  );
}

export function getEstimates(symbol: string, period: StatementPeriod = "annual") {
  return fmpList<FmpEstimate>(
    "/analyst-estimates",
    { symbol: symbol.toUpperCase(), period, limit: 8 },
    { revalidate: 3600 },
  );
}

export function getScreener(
  params: Record<string, QueryValue> = {},
  {
    page = 0,
    limit = 50,
    revalidate = 300,
  }: { page?: number; limit?: number; revalidate?: number } = {},
) {
  return fmpList<FmpScreenerRow>(
    "/company-screener",
    {
      isEtf: false,
      isFund: false,
      isActivelyTrading: true,
      ...params,
      page,
      limit,
    },
    { revalidate },
  );
}

export async function getScreenerPages(
  params: Record<string, QueryValue> = {},
  { pages = 2, limit = 1000, revalidate = 1800 }: { pages?: number; limit?: number; revalidate?: number } = {},
) {
  const rows: FmpScreenerRow[] = [];
  for (let page = 0; page < pages; page++) {
    const batch = await getScreener(params, { page, limit, revalidate });
    rows.push(...batch);
    if (batch.length < limit) break;
  }
  return rows;
}

export async function getSectors() {
  const rows = await fmpList<{ sector: string }>("/available-sectors", {}, { revalidate: 86400 });
  return rows.map((row) => row.sector).filter(Boolean);
}

export function getIndustries() {
  return fmpList<{ industry?: string }>("/available-industries", {}, { revalidate: 86400 });
}

export async function getIndustryNames() {
  const rows = await getIndustries();
  return [...new Set(rows.map((row) => row.industry).filter((name): name is string => Boolean(name)))].sort((a, b) =>
    a.localeCompare(b),
  );
}

export function getExchanges() {
  return fmpList<{ exchange?: string; name?: string } | string>(
    "/available-exchanges",
    {},
    { revalidate: 86400 },
  );
}

export function getSectorPerformance(date: string) {
  return fmpList<FmpSectorPerformance>(
    "/sector-performance-snapshot",
    { date },
    { revalidate: 300 },
  );
}

export function getMarketHours(exchange = "NASDAQ") {
  return fmpFirst<FmpMarketHours>(
    "/exchange-market-hours",
    { exchange },
    { revalidate: 60 },
  );
}

export function getKeyExecutives(symbol: string) {
  return fmpList<FmpExecutive>(
    "/key-executives",
    { symbol: symbol.toUpperCase() },
    { revalidate: 86400 },
  );
}

export function getEtfInfo(symbol: string) {
  return fmpFirst<FmpEtfInfo>("/etf/info", { symbol: symbol.toUpperCase() }, { revalidate: 3600 });
}

export function getEtfHoldings(symbol: string) {
  return fmpList<FmpEtfHolding>(
    "/etf/holdings",
    { symbol: symbol.toUpperCase() },
    { revalidate: 3600 },
  );
}

export function getEtfSectors(symbol: string) {
  return fmpList<FmpEtfSector>(
    "/etf/sector-weightings",
    { symbol: symbol.toUpperCase() },
    { revalidate: 3600 },
  );
}

export function getIndexConstituents(index: "sp500" | "nasdaq" | "dow") {
  const path = {
    sp500: "/sp500-constituent",
    nasdaq: "/nasdaq-constituent",
    dow: "/dowjones-constituent",
  }[index];
  return fmpList<FmpIndexConstituent>(path, {}, { revalidate: 86400 });
}

export function getSplits(symbol: string, limit = 20) {
  return fmpList<FmpSplit>("/splits", { symbol: symbol.toUpperCase(), limit }, { revalidate: 86400 });
}

export function getSplitsCalendar(from: string, to: string) {
  return fmpList<FmpSplit>("/splits-calendar", { from, to }, { revalidate: 600 });
}

export function getInsiderTrades(symbol: string, limit = 50) {
  return fmpList<FmpInsiderTrade>(
    "/insider-trading/search",
    { symbol: symbol.toUpperCase(), page: 0, limit },
    { revalidate: 300 },
  );
}

export function getLatestInsiderTrades(limit = 50) {
  return fmpList<FmpInsiderTrade>(
    "/insider-trading/latest",
    { page: 0, limit },
    { revalidate: 120 },
  );
}

export function getShareFloat(symbol: string) {
  return fmpFirst<FmpShareFloat>(
    "/shares-float",
    { symbol: symbol.toUpperCase() },
    { revalidate: 3600 },
  );
}

export function getHistoricalMarketCap(symbol: string, limit = 90, from?: string, to?: string) {
  return fmpList<FmpHistoricalMarketCap>(
    "/historical-market-capitalization",
    { symbol: symbol.toUpperCase(), limit, from, to },
    { revalidate: 3600 },
  );
}

export function getIncomeGrowth(symbol: string, period: StatementPeriod = "annual", limit = 8) {
  return fmpList<FmpIncomeGrowth>(
    "/income-statement-growth",
    { symbol: symbol.toUpperCase(), period, limit },
    { revalidate: 3600 },
  );
}

export function getFullDailyChart(symbol: string, from?: string, to?: string) {
  return fmpList<FmpFullCandle>(
    "/historical-price-eod/full",
    { symbol: symbol.toUpperCase(), from, to },
    { revalidate: 300 },
  );
}

export function getSecFilings(symbol: string, from: string, to: string, limit = 50) {
  return fmpList<FmpSecFiling>(
    "/sec-filings-search/symbol",
    { symbol: symbol.toUpperCase(), from, to, page: 0, limit },
    { revalidate: 600 },
  );
}

export function getTranscriptDates(symbol: string) {
  return fmpList<FmpTranscriptDate>(
    "/earning-call-transcript-dates",
    { symbol: symbol.toUpperCase() },
    { revalidate: 3600 },
  );
}

export function getTranscript(symbol: string, year: number, quarter: number) {
  return fmpFirst<FmpTranscript>(
    "/earning-call-transcript",
    { symbol: symbol.toUpperCase(), year, quarter },
    { revalidate: 86400 },
  );
}

export function getLatestTranscripts(limit = 30) {
  return fmpList<FmpTranscriptDate & { symbol: string; period?: string }>(
    "/earning-call-transcript-latest",
    { limit, page: 0 },
    { revalidate: 300 },
  );
}

export function getEconomicCalendar(from: string, to: string, country = "US") {
  return fmpList<FmpEconomicEvent>(
    "/economic-calendar",
    { from, to, country },
    { revalidate: 300 },
  );
}

function isPlausible13F(row: FmpInstitutionalSummary) {
  const previous = row.lastNumberOf13Fshares;
  const jump =
    typeof previous === "number" &&
    previous > 0 &&
    row.numberOf13Fshares / previous > 1.75;
  return !(jump && row.ownershipPercent > 95);
}

export async function getLatestInstitutionalOwnership(symbol: string, holderLimit = 40) {
  const ticker = symbol.toUpperCase();
  let backup: { year: number; quarter: number; row: FmpInstitutionalSummary } | null = null;

  for (const period of recentFiscalQuarters(6)) {
    const rows = await fmpList<FmpInstitutionalSummary>(
      "/institutional-ownership/symbol-positions-summary",
      { symbol: ticker, year: period.year, quarter: period.quarter },
      { revalidate: 3600 },
    );
    const row = rows[0];
    if (!row) continue;
    if (isPlausible13F(row)) {
      const holders = await fmpList<FmpInstitutionalHolder>(
        "/institutional-ownership/extract-analytics/holder",
        { symbol: ticker, year: period.year, quarter: period.quarter, page: 0, limit: holderLimit },
        { revalidate: 3600 },
      );
      return { summary: row, year: period.year, quarter: period.quarter, holders };
    }
    backup ??= { ...period, row };
  }

  if (!backup) {
    return { summary: null, year: null, quarter: null, holders: [] as FmpInstitutionalHolder[] };
  }

  const holders = await fmpList<FmpInstitutionalHolder>(
    "/institutional-ownership/extract-analytics/holder",
    { symbol: ticker, year: backup.year, quarter: backup.quarter, page: 0, limit: holderLimit },
    { revalidate: 3600 },
  );
  return { summary: backup.row, year: backup.year, quarter: backup.quarter, holders };
}

export function getEmployeeCount(symbol: string, limit = 8) {
  return fmpList<FmpEmployeeCount>(
    "/employee-count",
    { symbol: symbol.toUpperCase(), limit },
    { revalidate: 86400 },
  );
}

export function getHistoricalEmployeeCount(symbol: string, limit = 40) {
  return fmpList<FmpEmployeeCount>(
    "/historical-employee-count",
    { symbol: symbol.toUpperCase(), limit },
    { revalidate: 86400 },
  );
}

function normalizeDcf(row: FmpDcf | null) {
  if (!row) return null;
  const stockPrice = typeof row.stockPrice === "number" ? row.stockPrice : row["Stock Price"];
  return { symbol: row.symbol, date: row.date, dcf: row.dcf, stockPrice };
}

export async function getDcf(symbol: string) {
  const row = await fmpFirst<FmpDcf>(
    "/discounted-cash-flow",
    { symbol: symbol.toUpperCase() },
    { revalidate: 3600 },
  );
  return normalizeDcf(row);
}

export async function getLeveredDcf(symbol: string) {
  const row = await fmpFirst<FmpDcf>(
    "/levered-discounted-cash-flow",
    { symbol: symbol.toUpperCase() },
    { revalidate: 3600 },
  );
  return normalizeDcf(row);
}

export function getRevenueProductSegments(symbol: string, period: StatementPeriod = "annual") {
  return fmpList<FmpRevenueSegment>(
    "/revenue-product-segmentation",
    { symbol: symbol.toUpperCase(), period, structure: "flat" },
    { revalidate: 86400 },
  );
}

export function getRevenueGeographicSegments(symbol: string, period: StatementPeriod = "annual") {
  return fmpList<FmpRevenueSegment>(
    "/revenue-geographic-segmentation",
    { symbol: symbol.toUpperCase(), period, structure: "flat" },
    { revalidate: 86400 },
  );
}

export function getIndustryPerformance(date: string) {
  return fmpList<FmpIndustryPerformance>(
    "/industry-performance-snapshot",
    { date },
    { revalidate: 300 },
  );
}

export function getIndustryPeSnapshot(date: string) {
  return fmpList<FmpIndustryPe>(
    "/industry-pe-snapshot",
    { date },
    { revalidate: 300 },
  );
}

export function getLatestMergers(limit = 50) {
  return fmpList<FmpMerger>(
    "/mergers-acquisitions-latest",
    { page: 0, limit },
    { revalidate: 300 },
  );
}

export function getIpoDisclosures(from: string, to: string) {
  return fmpList<FmpIpoDisclosure>("/ipos-disclosure", { from, to }, { revalidate: 600 });
}

export function getIpoProspectuses(from: string, to: string) {
  return fmpList<FmpIpoProspectus>("/ipos-prospectus", { from, to }, { revalidate: 600 });
}

export async function withQuoteChanges<T extends { symbol: string; price?: number }>(rows: T[]) {
  if (rows.length === 0) return [] as Array<T & { changePercentage?: number; change?: number }>;
  const quotes = await getQuotes(rows.map((row) => row.symbol));
  const bySymbol = new Map(quotes.map((quote) => [quote.symbol, quote]));
  return rows.map((row) => {
    const quote = bySymbol.get(row.symbol);
    return {
      ...row,
      price: quote?.price ?? row.price,
      changePercentage: quote?.changePercentage,
      change: quote?.change,
    };
  });
}

export const POPULAR_SYMBOLS = [
  "AAPL",
  "MSFT",
  "NVDA",
  "GOOGL",
  "AMZN",
  "META",
  "TSLA",
  "BRK.B",
  "JPM",
  "V",
] as const;

export const INDEX_SYMBOLS = [
  { symbol: "^GSPC", label: "S&P 500" },
  { symbol: "^DJI", label: "Dow Jones" },
  { symbol: "^IXIC", label: "Nasdaq" },
  { symbol: "^RUT", label: "Russell 2000" },
  { symbol: "^VIX", label: "VIX" },
] as const;

export function getIndexQuotes() {
  return getQuotes(INDEX_SYMBOLS.map((item) => item.symbol));
}
