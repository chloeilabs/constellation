import { connection } from "next/server";
import { decodeTicker, looksLikeFund } from "@/lib/listings";
import { addDays, chunk, first, isoDate, recentFiscalQuarters } from "@/lib/utils";
import type {
  FmpAftermarketQuote,
  FmpAftermarketTrade,
  FmpEtfListItem,
  FmpTechnicalPoint,
  FmpBalanceSheet,
  FmpCashFlow,
  FmpDividend,
  FmpEarnings,
  FmpEconomicEvent,
  FmpEstimate,
  FmpEtfHolding,
  FmpEtfInfo,
  FmpEtfSector,
  FmpEtfCountryWeight,
  FmpEtfExposure,
  FmpExecutive,
  FmpFullCandle,
  FmpGrade,
  FmpGradesConsensus,
  FmpHistoricalGrade,
  FmpHistoricalRating,
  FmpHistoricalMarketCap,
  FmpIncomeGrowth,
  FmpIncomeStatement,
  FmpIndexConstituent,
  FmpInsiderTrade,
  FmpInsiderStatistics,
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
  FmpPriceTargetSummary,
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
  FmpSectorPe,
  FmpGradeNews,
  FmpCommodity,
  FmpCommodityQuote,
  FmpCrypto,
  FmpForex,
  FmpKeyMetrics,
  FmpMerger,
  FmpIpoDisclosure,
  FmpIpoProspectus,
  FmpCongressTrade,
  FmpOwnerEarnings,
  FmpEnterpriseValue,
  FmpTreasuryRate,
  FmpEconomicIndicator,
  FmpHistoricalConstituent,
  FmpSymbolChange,
  FmpDelisted,
  FmpFinancialGrowth,
  FmpEsgRating,
  FmpEsgDisclosure,
  FmpCompanyNote,
  FmpInstitutionalFiling,
  FmpExecutiveCompensation,
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
  return fmpFirst<FmpQuote>("/quote", { symbol: decodeTicker(symbol) }, { revalidate: 30 });
}

export async function getQuoteSafe(symbol: string) {
  const ticker = decodeTicker(symbol);
  if (ticker.startsWith("^")) {
    const rows = await getQuotes([ticker]);
    return rows[0] ?? null;
  }
  return getQuote(ticker);
}

export async function getQuotes(symbols: string[]) {
  const unique = [...new Set(symbols.map((symbol) => decodeTicker(symbol)).filter(Boolean))];
  if (unique.length === 0) return [] as FmpQuote[];
  const groups = await Promise.all(
    chunk(unique, 80).map((group) =>
      fmpList<FmpQuote>("/batch-quote", { symbols: group.join(",") }, { revalidate: 30 }),
    ),
  );
  return groups.flat();
}

export function getProfile(symbol: string) {
  return fmpFirst<FmpProfile>("/profile", { symbol: decodeTicker(symbol) }, { revalidate: 3600 });
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
  const [bySymbol, byName, etfSymbols] = await Promise.all([
    searchSymbol(trimmed, Math.max(limit, 12)),
    searchName(trimmed, Math.max(limit, 12)),
    getEtfSymbolSet(),
  ]);
  const seen = new Set<string>();
  const merged: FmpSearchResult[] = [];
  for (const item of [...bySymbol, ...byName]) {
    if (!item.symbol) continue;
    const key = `${item.symbol}-${item.exchange}`;
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push({
      ...item,
      isEtf: item.isEtf || etfSymbols.has(item.symbol.toUpperCase()),
      isFund: item.isFund || looksLikeFund(item.name),
    });
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

export function getGeneralNews(limit = 20, page = 0) {
  return fmpList<FmpNewsItem>(
    "/news/general-latest",
    { limit, page },
    { revalidate: 120 },
  );
}

export function getLatestPressReleases(limit = 20, page = 0) {
  return fmpList<FmpNewsItem>(
    "/news/press-releases-latest",
    { limit, page },
    { revalidate: 180 },
  );
}

export function getSymbolNews(symbol: string, limit = 20) {
  return fmpList<FmpNewsItem>(
    "/news/stock",
    { symbols: decodeTicker(symbol), limit },
    { revalidate: 120 },
  );
}

export function getPressReleases(symbol: string, limit = 10) {
  return fmpList<FmpNewsItem>(
    "/news/press-releases",
    { symbols: decodeTicker(symbol), limit },
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
    { symbol: decodeTicker(symbol), limit },
    { revalidate: 3600 },
  );
}

export function getDividends(symbol: string, limit = 40) {
  return fmpList<FmpDividend>(
    "/dividends",
    { symbol: decodeTicker(symbol), limit },
    { revalidate: 3600 },
  );
}

export function getDividendCalendar(from: string, to: string) {
  return fmpList<FmpDividend>("/dividends-calendar", { from, to }, { revalidate: 600 });
}

export function getPriceChange(symbol: string) {
  return fmpFirst<FmpPriceChange>(
    "/stock-price-change",
    { symbol: decodeTicker(symbol) },
    { revalidate: 120 },
  );
}

export function getAftermarketQuote(symbol: string) {
  return fmpFirst<FmpAftermarketQuote>(
    "/aftermarket-quote",
    { symbol: decodeTicker(symbol) },
    { revalidate: 15 },
  );
}

export function getAftermarketTrade(symbol: string) {
  return fmpFirst<FmpAftermarketTrade>(
    "/aftermarket-trade",
    { symbol: decodeTicker(symbol) },
    { revalidate: 15 },
  );
}

export async function getBatchAftermarketQuotes(symbols: string[]) {
  const unique = [...new Set(symbols.map((symbol) => decodeTicker(symbol)).filter(Boolean))];
  if (unique.length === 0) return [] as FmpAftermarketQuote[];
  const groups = await Promise.all(
    chunk(unique, 80).map((group) =>
      fmpList<FmpAftermarketQuote>("/batch-aftermarket-quote", { symbols: group.join(",") }, { revalidate: 15 }),
    ),
  );
  return groups.flat();
}

export async function getBatchAftermarketTrades(symbols: string[]) {
  const unique = [...new Set(symbols.map((symbol) => decodeTicker(symbol)).filter(Boolean))];
  if (unique.length === 0) return [] as FmpAftermarketTrade[];
  const groups = await Promise.all(
    chunk(unique, 80).map((group) =>
      fmpList<FmpAftermarketTrade>("/batch-aftermarket-trade", { symbols: group.join(",") }, { revalidate: 15 }),
    ),
  );
  return groups.flat();
}

export function mergeAftermarketQuote(
  quote: FmpAftermarketQuote | null,
  trade: FmpAftermarketTrade | null,
): FmpAftermarketQuote | null {
  if (!quote && !trade) return null;
  return {
    symbol: quote?.symbol ?? trade?.symbol ?? "",
    bidSize: quote?.bidSize ?? 0,
    bidPrice: quote?.bidPrice ?? 0,
    askSize: quote?.askSize ?? 0,
    askPrice: quote?.askPrice ?? 0,
    volume: quote?.volume ?? 0,
    timestamp: trade?.timestamp ?? quote?.timestamp ?? 0,
    lastPrice: trade?.price,
  };
}

export async function getLatestRsi(symbol: string, periodLength = 14) {
  const from = isoDate(addDays(new Date(), -45));
  const rows = await fmpList<FmpTechnicalPoint>(
    "/technical-indicators/rsi",
    { symbol: decodeTicker(symbol), periodLength, timeframe: "1day", from },
    { revalidate: 300 },
  );
  if (rows.length === 0) return null;
  return [...rows].sort((a, b) => b.date.localeCompare(a.date))[0];
}

export function getEtfList() {
  return fmpList<FmpEtfListItem>("/etf-list", {}, { revalidate: 86400 });
}

export async function getEtfSymbolSet() {
  const rows = await getEtfList();
  return new Set(rows.map((row) => row.symbol.toUpperCase()).filter(Boolean));
}

export function getDailyChart(symbol: string, from?: string, to?: string) {
  return fmpList<FmpLightCandle>(
    "/historical-price-eod/light",
    { symbol: decodeTicker(symbol), from, to },
    { revalidate: 300 },
  );
}

export function getIntradayChart(symbol: string, interval: "1min" | "5min" | "15min" | "1hour") {
  return fmpList<FmpIntradayCandle>(
    `/historical-chart/${interval}`,
    { symbol: decodeTicker(symbol) },
    { revalidate: 30 },
  );
}

export function getIncomeStatements(symbol: string, period: StatementPeriod, limit = 8) {
  return fmpList<FmpIncomeStatement>(
    "/income-statement",
    { symbol: decodeTicker(symbol), period, limit },
    { revalidate: 3600 },
  );
}

export function getIncomeTtm(symbol: string) {
  return fmpFirst<FmpIncomeStatement>(
    "/income-statement-ttm",
    { symbol: decodeTicker(symbol) },
    { revalidate: 3600 },
  );
}

export function getBalanceSheets(symbol: string, period: StatementPeriod, limit = 8) {
  return fmpList<FmpBalanceSheet>(
    "/balance-sheet-statement",
    { symbol: decodeTicker(symbol), period, limit },
    { revalidate: 3600 },
  );
}

export function getCashFlows(symbol: string, period: StatementPeriod, limit = 8) {
  return fmpList<FmpCashFlow>(
    "/cash-flow-statement",
    { symbol: decodeTicker(symbol), period, limit },
    { revalidate: 3600 },
  );
}

export function getCashFlowTtm(symbol: string) {
  return fmpFirst<FmpCashFlow>(
    "/cash-flow-statement-ttm",
    { symbol: decodeTicker(symbol) },
    { revalidate: 3600 },
  );
}

export function getRatios(symbol: string, period: StatementPeriod, limit = 8) {
  return fmpList<FmpRatios>(
    "/ratios",
    { symbol: decodeTicker(symbol), period, limit },
    { revalidate: 3600 },
  );
}

export function getRatiosTtm(symbol: string) {
  return fmpFirst<FmpRatiosTtm>(
    "/ratios-ttm",
    { symbol: decodeTicker(symbol) },
    { revalidate: 3600 },
  );
}

export function getKeyMetricsTtm(symbol: string) {
  return fmpFirst<FmpKeyMetricsTtm>(
    "/key-metrics-ttm",
    { symbol: decodeTicker(symbol) },
    { revalidate: 3600 },
  );
}

export function getKeyMetrics(symbol: string, period: StatementPeriod, limit = 8) {
  return fmpList<FmpKeyMetrics>(
    "/key-metrics",
    { symbol: decodeTicker(symbol), period, limit },
    { revalidate: 3600 },
  );
}

export function getPriceTarget(symbol: string) {
  return fmpFirst<FmpPriceTarget>(
    "/price-target-consensus",
    { symbol: decodeTicker(symbol) },
    { revalidate: 3600 },
  );
}

export function getPriceTargetSummary(symbol: string) {
  return fmpFirst<FmpPriceTargetSummary>(
    "/price-target-summary",
    { symbol: decodeTicker(symbol) },
    { revalidate: 3600 },
  );
}

export function getGradesConsensus(symbol: string) {
  return fmpFirst<FmpGradesConsensus>(
    "/grades-consensus",
    { symbol: decodeTicker(symbol) },
    { revalidate: 3600 },
  );
}

export function getGrades(symbol: string, limit = 12) {
  return fmpList<FmpGrade>(
    "/grades",
    { symbol: decodeTicker(symbol), limit },
    { revalidate: 3600 },
  );
}

export function getGradesHistorical(symbol: string, limit = 16) {
  return fmpList<FmpHistoricalGrade>(
    "/grades-historical",
    { symbol: decodeTicker(symbol), limit },
    { revalidate: 3600 },
  );
}

export function getRatings(symbol: string) {
  return fmpFirst<FmpRatings>(
    "/ratings-snapshot",
    { symbol: decodeTicker(symbol) },
    { revalidate: 3600 },
  );
}

export function getRatingsHistorical(symbol: string, limit = 16) {
  return fmpList<FmpHistoricalRating>(
    "/ratings-historical",
    { symbol: decodeTicker(symbol), limit },
    { revalidate: 3600 },
  );
}

export function getScores(symbol: string) {
  return fmpFirst<FmpScores>(
    "/financial-scores",
    { symbol: decodeTicker(symbol) },
    { revalidate: 3600 },
  );
}

export function getPeers(symbol: string) {
  return fmpList<FmpPeer>(
    "/stock-peers",
    { symbol: decodeTicker(symbol) },
    { revalidate: 3600 },
  );
}

export function getEstimates(symbol: string, period: StatementPeriod = "annual") {
  return fmpList<FmpEstimate>(
    "/analyst-estimates",
    { symbol: decodeTicker(symbol), period, limit: 8 },
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

export function getHistoricalSectorPerformance(sector: string, from: string, to: string) {
  return fmpList<FmpSectorPerformance>(
    "/historical-sector-performance",
    { sector, from, to },
    { revalidate: 3600 },
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
    { symbol: decodeTicker(symbol) },
    { revalidate: 86400 },
  );
}

export function getEtfInfo(symbol: string) {
  return fmpFirst<FmpEtfInfo>("/etf/info", { symbol: decodeTicker(symbol) }, { revalidate: 3600 });
}

export function getEtfHoldings(symbol: string) {
  return fmpList<FmpEtfHolding>(
    "/etf/holdings",
    { symbol: decodeTicker(symbol) },
    { revalidate: 3600 },
  );
}

export function getEtfSectors(symbol: string) {
  return fmpList<FmpEtfSector>(
    "/etf/sector-weightings",
    { symbol: decodeTicker(symbol) },
    { revalidate: 3600 },
  );
}

export function getEtfCountryWeights(symbol: string) {
  return fmpList<FmpEtfCountryWeight>(
    "/etf/country-weightings",
    { symbol: decodeTicker(symbol) },
    { revalidate: 3600 },
  );
}

export function getEtfAssetExposure(symbol: string) {
  return fmpList<FmpEtfExposure>(
    "/etf/asset-exposure",
    { symbol: decodeTicker(symbol) },
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

export function getHistoricalConstituents(index: "sp500" | "nasdaq" | "dow") {
  const path = {
    sp500: "/historical-sp500-constituent",
    nasdaq: "/historical-nasdaq-constituent",
    dow: "/historical-dowjones-constituent",
  }[index];
  return fmpList<FmpHistoricalConstituent>(path, {}, { revalidate: 86400 });
}

export function getSplits(symbol: string, limit = 20) {
  return fmpList<FmpSplit>("/splits", { symbol: decodeTicker(symbol), limit }, { revalidate: 86400 });
}

export function getSplitsCalendar(from: string, to: string) {
  return fmpList<FmpSplit>("/splits-calendar", { from, to }, { revalidate: 600 });
}

export function getInsiderTrades(symbol: string, limit = 50) {
  return fmpList<FmpInsiderTrade>(
    "/insider-trading/search",
    { symbol: decodeTicker(symbol), page: 0, limit },
    { revalidate: 300 },
  );
}

export function getInsiderStatistics(symbol: string) {
  return fmpList<FmpInsiderStatistics>(
    "/insider-trading/statistics",
    { symbol: decodeTicker(symbol) },
    { revalidate: 3600 },
  );
}

export function getLatestInsiderTrades(limit = 50) {
  return fmpList<FmpInsiderTrade>(
    "/insider-trading/latest",
    { page: 0, limit },
    { revalidate: 120 },
  );
}

export function getSenateLatest(limit = 100) {
  return fmpList<FmpCongressTrade>("/senate-latest", { page: 0, limit }, { revalidate: 300 });
}

export function getHouseLatest(limit = 100) {
  return fmpList<FmpCongressTrade>("/house-latest", { page: 0, limit }, { revalidate: 300 });
}

export function getSenateTrades(symbol: string, limit = 50) {
  return fmpList<FmpCongressTrade>(
    "/senate-trades",
    { symbol: decodeTicker(symbol), page: 0, limit },
    { revalidate: 600 },
  );
}

export function getHouseTrades(symbol: string, limit = 50) {
  return fmpList<FmpCongressTrade>(
    "/house-trades",
    { symbol: decodeTicker(symbol), page: 0, limit },
    { revalidate: 600 },
  );
}

export function getShareFloat(symbol: string) {
  return fmpFirst<FmpShareFloat>(
    "/shares-float",
    { symbol: decodeTicker(symbol) },
    { revalidate: 3600 },
  );
}

export function getHistoricalMarketCap(symbol: string, limit = 90, from?: string, to?: string) {
  return fmpList<FmpHistoricalMarketCap>(
    "/historical-market-capitalization",
    { symbol: decodeTicker(symbol), limit, from, to },
    { revalidate: 3600 },
  );
}

export function getIncomeGrowth(symbol: string, period: StatementPeriod = "annual", limit = 8) {
  return fmpList<FmpIncomeGrowth>(
    "/income-statement-growth",
    { symbol: decodeTicker(symbol), period, limit },
    { revalidate: 3600 },
  );
}

export function getFullDailyChart(symbol: string, from?: string, to?: string) {
  return fmpList<FmpFullCandle>(
    "/historical-price-eod/full",
    { symbol: decodeTicker(symbol), from, to },
    { revalidate: 300 },
  );
}

export function getSecFilings(symbol: string, from: string, to: string, limit = 50) {
  return fmpList<FmpSecFiling>(
    "/sec-filings-search/symbol",
    { symbol: decodeTicker(symbol), from, to, page: 0, limit },
    { revalidate: 600 },
  );
}

export function getTranscriptDates(symbol: string) {
  return fmpList<FmpTranscriptDate>(
    "/earning-call-transcript-dates",
    { symbol: decodeTicker(symbol) },
    { revalidate: 3600 },
  );
}

export function getTranscript(symbol: string, year: number, quarter: number) {
  return fmpFirst<FmpTranscript>(
    "/earning-call-transcript",
    { symbol: decodeTicker(symbol), year, quarter },
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
  const ticker = decodeTicker(symbol);
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
    { symbol: decodeTicker(symbol), limit },
    { revalidate: 86400 },
  );
}

export function getHistoricalEmployeeCount(symbol: string, limit = 40) {
  return fmpList<FmpEmployeeCount>(
    "/historical-employee-count",
    { symbol: decodeTicker(symbol), limit },
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
    { symbol: decodeTicker(symbol) },
    { revalidate: 3600 },
  );
  return normalizeDcf(row);
}

export async function getLeveredDcf(symbol: string) {
  const row = await fmpFirst<FmpDcf>(
    "/levered-discounted-cash-flow",
    { symbol: decodeTicker(symbol) },
    { revalidate: 3600 },
  );
  return normalizeDcf(row);
}

export function getRevenueProductSegments(symbol: string, period: StatementPeriod = "annual") {
  return fmpList<FmpRevenueSegment>(
    "/revenue-product-segmentation",
    { symbol: decodeTicker(symbol), period, structure: "flat" },
    { revalidate: 86400 },
  );
}

export function getRevenueGeographicSegments(symbol: string, period: StatementPeriod = "annual") {
  return fmpList<FmpRevenueSegment>(
    "/revenue-geographic-segmentation",
    { symbol: decodeTicker(symbol), period, structure: "flat" },
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

export function getSectorPeSnapshot(date: string) {
  return fmpList<FmpSectorPe>(
    "/sector-pe-snapshot",
    { date },
    { revalidate: 300 },
  );
}

export function getGradesLatestNews(limit = 80) {
  return fmpList<FmpGradeNews>(
    "/grades-latest-news",
    { page: 0, limit },
    { revalidate: 120 },
  );
}

export function getCommoditiesList() {
  return fmpList<FmpCommodity>("/commodities-list", {}, { revalidate: 86400 });
}

export function getCommodityQuotes() {
  return fmpList<FmpCommodityQuote>("/batch-commodity-quotes", {}, { revalidate: 60 });
}

export function getCryptocurrencyList() {
  return fmpList<FmpCrypto>("/cryptocurrency-list", {}, { revalidate: 86400 });
}

export function getCryptoQuotes() {
  return fmpList<FmpCommodityQuote>("/batch-crypto-quotes", {}, { revalidate: 60 });
}

export function getForexList() {
  return fmpList<FmpForex>("/forex-list", {}, { revalidate: 86400 });
}

export function getForexQuotes() {
  return fmpList<FmpCommodityQuote>("/batch-forex-quotes", {}, { revalidate: 60 });
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

export function getOwnerEarnings(symbol: string, limit = 20) {
  return fmpList<FmpOwnerEarnings>(
    "/owner-earnings",
    { symbol: decodeTicker(symbol), limit },
    { revalidate: 3600 },
  );
}

export function getEnterpriseValues(symbol: string, period: StatementPeriod = "annual", limit = 20) {
  return fmpList<FmpEnterpriseValue>(
    "/enterprise-values",
    { symbol: decodeTicker(symbol), period, limit },
    { revalidate: 3600 },
  );
}

export function getTreasuryRates(from: string, to: string) {
  return fmpList<FmpTreasuryRate>("/treasury-rates", { from, to }, { revalidate: 3600 });
}

export function getEconomicIndicator(name: string, from?: string, to?: string) {
  return fmpList<FmpEconomicIndicator>(
    "/economic-indicators",
    { name, from, to },
    { revalidate: 86400 },
  );
}

export function getFinancialGrowth(symbol: string, period: StatementPeriod = "annual", limit = 8) {
  return fmpList<FmpFinancialGrowth>(
    "/financial-growth",
    { symbol: decodeTicker(symbol), period, limit },
    { revalidate: 3600 },
  );
}

export function getSymbolChanges() {
  return fmpList<FmpSymbolChange>("/symbol-change", {}, { revalidate: 3600 });
}

export function getDelistedCompanies(page = 0, limit = 100) {
  return fmpList<FmpDelisted>("/delisted-companies", { page, limit }, { revalidate: 3600 });
}

export function getEsgRatings(symbol: string) {
  return fmpList<FmpEsgRating>(
    "/esg-ratings",
    { symbol: decodeTicker(symbol) },
    { revalidate: 86400 },
  );
}

export function getEsgDisclosures(symbol: string) {
  return fmpList<FmpEsgDisclosure>(
    "/esg-disclosures",
    { symbol: decodeTicker(symbol) },
    { revalidate: 86400 },
  );
}

export function getCompanyNotes(symbol: string) {
  return fmpList<FmpCompanyNote>(
    "/company-notes",
    { symbol: decodeTicker(symbol) },
    { revalidate: 86400 },
  );
}

export function getLatestInstitutionalFilings(limit = 80) {
  return fmpList<FmpInstitutionalFiling>(
    "/institutional-ownership/latest",
    { page: 0, limit },
    { revalidate: 300 },
  );
}

export function getExecutiveCompensation(symbol: string) {
  return fmpList<FmpExecutiveCompensation>(
    "/governance-executive-compensation",
    { symbol: decodeTicker(symbol) },
    { revalidate: 86400 },
  );
}

export async function withQuoteChanges<T extends { symbol: string; price?: number }>(rows: T[]) {
  if (rows.length === 0) return [] as Array<T & { changePercentage?: number; change?: number; pe?: number }>;
  const quotes = await getQuotes(rows.map((row) => row.symbol));
  const bySymbol = new Map(quotes.map((quote) => [quote.symbol, quote]));
  return rows.map((row) => {
    const quote = bySymbol.get(row.symbol);
    return {
      ...row,
      price: quote?.price ?? row.price,
      changePercentage: quote?.changePercentage,
      change: quote?.change,
      pe: quote?.pe,
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

export const WORLD_INDEX_SYMBOLS = [
  { symbol: "^N225", label: "Nikkei 225", region: "Japan" },
  { symbol: "^FTSE", label: "FTSE 100", region: "United Kingdom" },
  { symbol: "^GDAXI", label: "DAX", region: "Germany" },
  { symbol: "^FCHI", label: "CAC 40", region: "France" },
  { symbol: "^STOXX50E", label: "Euro Stoxx 50", region: "Eurozone" },
  { symbol: "^SSMI", label: "SMI", region: "Switzerland" },
  { symbol: "^HSI", label: "Hang Seng", region: "Hong Kong" },
  { symbol: "^AXJO", label: "S&P/ASX 200", region: "Australia" },
  { symbol: "^GSPTSE", label: "S&P/TSX", region: "Canada" },
  { symbol: "^BVSP", label: "Bovespa", region: "Brazil" },
  { symbol: "^KS11", label: "KOSPI", region: "South Korea" },
  { symbol: "^TWII", label: "TAIEX", region: "Taiwan" },
  { symbol: "^BSESN", label: "BSE Sensex", region: "India" },
  { symbol: "^MXX", label: "IPC", region: "Mexico" },
  { symbol: "^STI", label: "STI", region: "Singapore" },
  { symbol: "^JKSE", label: "Jakarta Composite", region: "Indonesia" },
] as const;

export function getWorldIndexQuotes() {
  return getQuotes(WORLD_INDEX_SYMBOLS.map((item) => item.symbol));
}
