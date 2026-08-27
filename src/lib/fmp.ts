import { first } from "@/lib/utils";
import type {
  FmpAftermarketQuote,
  FmpBalanceSheet,
  FmpCashFlow,
  FmpDividend,
  FmpEarnings,
  FmpEstimate,
  FmpGrade,
  FmpGradesConsensus,
  FmpIncomeStatement,
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
  StatementPeriod,
} from "@/lib/types";

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

export function getQuotes(symbols: string[]) {
  const unique = [...new Set(symbols.map((symbol) => symbol.toUpperCase()).filter(Boolean))];
  if (unique.length === 0) return Promise.resolve([] as FmpQuote[]);
  return fmpList<FmpQuote>("/batch-quote", { symbols: unique.join(",") }, { revalidate: 30 });
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
    searchSymbol(trimmed, limit),
    searchName(trimmed, limit),
  ]);
  const seen = new Set<string>();
  const merged: FmpSearchResult[] = [];
  for (const item of [...bySymbol, ...byName]) {
    const key = `${item.symbol}-${item.exchange}`;
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push(item);
    if (merged.length >= limit) break;
  }
  return merged;
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
  { page = 0, limit = 50 }: { page?: number; limit?: number } = {},
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
    { revalidate: 300 },
  );
}

export async function getSectors() {
  const rows = await fmpList<{ sector: string }>("/available-sectors", {}, { revalidate: 86400 });
  return rows.map((row) => row.sector).filter(Boolean);
}

export function getIndustries() {
  return fmpList<{ industry?: string }>("/available-industries", {}, { revalidate: 86400 });
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
