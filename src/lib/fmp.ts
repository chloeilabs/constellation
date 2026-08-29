import { connection } from "next/server";
import { INDEX_SYMBOLS, WORLD_INDEX_SYMBOLS, isIndexTicker } from "@/lib/indexes";
import { decodeTicker, listedUsRows, looksLikeFund, uniqueBySymbol, usEtfHolders, WELL_KNOWN_MARKET_ASSETS } from "@/lib/listings";
import { mergeNews } from "@/lib/news";
import { addDays, chunk, first, isoDate, nyDateString, recentFiscalQuarters } from "@/lib/utils";
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
  FmpAdjustedCandle,
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
  FmpInsiderReportingName,
  FmpInsiderStatistics,
  FmpIdentifierMatch,
  FmpIntradayCandle,
  FmpIpo,
  FmpKeyMetricsTtm,
  FmpLightCandle,
  FmpMarketHours,
  FmpExchangeInfo,
  FmpExchangeHoliday,
  FmpIndexListItem,
  FmpBeneficialOwner,
  FmpSecProfile,
  FmpMover,
  FmpNewsItem,
  FmpPeer,
  FmpPriceChange,
  FmpPriceTarget,
  FmpPriceTargetNews,
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
  FmpInstitutionalDate,
  FmpInstitutionalExtract,
  FmpExchangeVariant,
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
  FmpSenateProfile,
  FmpSenatePosition,
  FmpSenateNetWorth,
  FmpFundDisclosureHolder,
  FmpLatestStatement,
  FmpCotAnalysis,
  FmpInstitutionalPerformance,
  FmpInstitutionalIndustry,
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
  FmpEsgBenchmark,
  FmpMarketRiskPremium,
  FmpCompanyNote,
  FmpInstitutionalFiling,
  FmpExecutiveCompensation,
  FmpAsReportedStatement,
  FmpFinancialReportDate,
  FmpFinancialReportJson,
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
  if (isIndexTicker(ticker)) {
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

export function searchCik(cik: string) {
  return fmpList<FmpIdentifierMatch>("/search-cik", { cik }, { revalidate: 3600 });
}

export function searchCusip(cusip: string) {
  return fmpList<FmpIdentifierMatch>("/search-cusip", { cusip }, { revalidate: 3600 });
}

export function searchIsin(isin: string) {
  return fmpList<FmpIdentifierMatch>("/search-isin", { isin }, { revalidate: 3600 });
}

function identifierToSearchResult(row: FmpIdentifierMatch): FmpSearchResult | null {
  const symbol = row.symbol?.trim();
  if (!symbol) return null;
  const dotted = symbol.includes(".");
  const suffix = dotted ? symbol.split(".").pop() ?? "" : "";
  const exchange = row.exchange || (dotted ? suffix : "NASDAQ");
  const exchangeFullName = row.exchangeFullName || row.exchange || (dotted ? suffix : "NASDAQ");
  return {
    symbol,
    name: row.companyName || row.name || symbol,
    currency: row.currency || "USD",
    exchange,
    exchangeFullName,
  };
}

function compactIdentifier(query: string) {
  return query.replace(/[\s-]/g, "").toUpperCase();
}

function looksLikeCik(value: string) {
  return /^\d{6,10}$/.test(value);
}

function looksLikeIsin(value: string) {
  return /^[A-Z]{2}[A-Z0-9]{10}$/.test(value);
}

function looksLikeCusip(value: string) {
  return /^[A-Z0-9]{9}$/.test(value) && /\d/.test(value);
}

async function identifierSearchResults(query: string) {
  const compact = compactIdentifier(query);
  const jobs: Promise<FmpIdentifierMatch[]>[] = [];
  if (looksLikeCik(compact)) jobs.push(searchCik(compact));
  if (looksLikeIsin(compact)) jobs.push(searchIsin(compact));
  if (looksLikeCusip(compact)) jobs.push(searchCusip(compact));
  if (jobs.length === 0) return [] as FmpSearchResult[];
  const rows = (await Promise.all(jobs)).flat();
  return rows.map(identifierToSearchResult).filter((row): row is FmpSearchResult => Boolean(row));
}

const MARKET_SEARCH_EXCHANGE: Record<string, { exchange: string; exchangeFullName: string }> = {
  crypto: { exchange: "CCC", exchangeFullName: "CRYPTO" },
  commodity: { exchange: "COMMODITY", exchangeFullName: "COMMODITY" },
  forex: { exchange: "CCY", exchangeFullName: "FOREX" },
};

function knownMarketAssetResults(query: string): FmpSearchResult[] {
  const needle = query.trim().toLowerCase();
  const compact = needle.replace(/[-/\s]/g, "");
  if (!needle) return [];
  return WELL_KNOWN_MARKET_ASSETS.flatMap((item) => {
    const symbol = item.symbol.toLowerCase();
    const aliases = item.aliases ?? [];
    const hit =
      symbol === needle ||
      symbol === compact ||
      item.name.toLowerCase() === needle ||
      aliases.some((alias) => alias === needle || alias.replace(/[-/\s]/g, "") === compact);
    if (!hit) return [];
    const venue = MARKET_SEARCH_EXCHANGE[item.kind];
    return [
      {
        symbol: item.symbol,
        name: item.name,
        currency: item.kind === "forex" ? item.symbol.slice(3) : "USD",
        exchange: venue.exchange,
        exchangeFullName: venue.exchangeFullName,
      } satisfies FmpSearchResult,
    ];
  });
}

export async function searchAll(query: string, limit = 8) {
  const trimmed = query.trim();
  if (!trimmed) return [] as FmpSearchResult[];
  const known = knownMarketAssetResults(trimmed);
  const compact = compactIdentifier(trimmed);
  const identifierQuery = looksLikeCik(compact) || looksLikeIsin(compact) || looksLikeCusip(compact);
  const [bySymbol, byName, etfSymbols, byIdentifier] = await Promise.all([
    identifierQuery ? Promise.resolve([] as FmpSearchResult[]) : searchSymbol(trimmed, Math.max(limit, 12)),
    identifierQuery ? Promise.resolve([] as FmpSearchResult[]) : searchName(trimmed, Math.max(limit, 12)),
    getEtfSymbolSet(),
    identifierSearchResults(trimmed),
  ]);
  const seen = new Set<string>();
  const merged: FmpSearchResult[] = [];
  const pinned = new Set(known.map((item) => item.symbol.toUpperCase()));
  for (const item of [...known, ...byIdentifier, ...bySymbol, ...byName]) {
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
      const venue = `${item.exchange} ${item.exchangeFullName}`;
      const pin = pinned.has(symbol) ? 0 : 1;
      const exact = symbol === needle ? 0 : 1;
      const indexName =
        /\bINDEX\b/i.test(venue) && (item.name || "").toUpperCase().includes(needle) ? 0 : 1;
      const us = usExchange.test(item.exchange) || usExchange.test(item.exchangeFullName) ? 0 : 1;
      const listed = symbol.includes(".") ? 1 : 0;
      const prefix = symbol.startsWith(needle) ? 0 : 1;
      return [pin, exact, indexName, us, listed, prefix, symbol.length] as const;
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

export function getSymbolNews(symbol: string, limit = 20, page = 0) {
  return fmpList<FmpNewsItem>(
    "/news/stock",
    { symbols: decodeTicker(symbol), limit, page },
    { revalidate: 120 },
  );
}

export function getCryptoNewsLatest(limit = 20, page = 0) {
  return fmpList<FmpNewsItem>("/news/crypto-latest", { limit, page }, { revalidate: 120 });
}

export function getForexNewsLatest(limit = 20, page = 0) {
  return fmpList<FmpNewsItem>("/news/forex-latest", { limit, page }, { revalidate: 120 });
}

export function getCryptoNews(symbol: string, limit = 20, page = 0) {
  return fmpList<FmpNewsItem>(
    "/news/crypto",
    { symbols: decodeTicker(symbol), limit, page },
    { revalidate: 120 },
  );
}

export function getForexNews(symbol: string, limit = 20, page = 0) {
  return fmpList<FmpNewsItem>(
    "/news/forex",
    { symbols: decodeTicker(symbol), limit, page },
    { revalidate: 120 },
  );
}

export function getPressReleases(symbol: string, limit = 10, page = 0) {
  return fmpList<FmpNewsItem>(
    "/news/press-releases",
    { symbols: decodeTicker(symbol), limit, page },
    { revalidate: 300 },
  );
}

const FMP_SYMBOL_NEWS_PAGE_SIZE = 200;
const FMP_SYMBOL_NEWS_MAX_PAGES = 9;
const FMP_PRESS_PAGE_SIZE = 50;
const FMP_PRESS_MAX_PAGES = 6;
const FMP_MARKET_NEWS_PAGE_SIZE = 50;
const FMP_CRYPTO_NEWS_MAX_PAGES = 8;
const FMP_FOREX_NEWS_MAX_PAGES = 6;

async function newsPages(load: (page: number) => Promise<FmpNewsItem[]>, pages: number) {
  const rows = await Promise.all(Array.from({ length: pages }, (_, page) => load(page)));
  return mergeNews(...rows);
}

/** `/news/stock` pages are unique; nine × 200 covers FMP's full AAPL dump. */
export function getSymbolNewsArchive(symbol: string) {
  const ticker = decodeTicker(symbol);
  return newsPages((page) => getSymbolNews(ticker, FMP_SYMBOL_NEWS_PAGE_SIZE, page), FMP_SYMBOL_NEWS_MAX_PAGES);
}

/** `/news/press-releases` page 1 is empty for AAPL but continues for names like MSFT. */
export function getPressReleasesArchive(symbol: string) {
  const ticker = decodeTicker(symbol);
  return newsPages((page) => getPressReleases(ticker, FMP_PRESS_PAGE_SIZE, page), FMP_PRESS_MAX_PAGES);
}

export function getCryptoNewsArchive(symbol: string) {
  const ticker = decodeTicker(symbol);
  return newsPages((page) => getCryptoNews(ticker, FMP_MARKET_NEWS_PAGE_SIZE, page), FMP_CRYPTO_NEWS_MAX_PAGES);
}

export function getForexNewsArchive(symbol: string) {
  const ticker = decodeTicker(symbol);
  return newsPages((page) => getForexNews(ticker, FMP_MARKET_NEWS_PAGE_SIZE, page), FMP_FOREX_NEWS_MAX_PAGES);
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

/** Full `/earnings` dump. AAPL is 165 rows through 1985 when `limit` is omitted. */
export function getCompanyEarningsHistory(symbol: string) {
  return fmpList<FmpEarnings>(
    "/earnings",
    { symbol: decodeTicker(symbol) },
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

/** FMP `/dividends-calendar` caps each response at 4,000 rows, so long windows must be sliced. */
export async function getDividendCalendarWindow(from: string, to: string) {
  const start = new Date(`${from}T00:00:00Z`);
  const end = new Date(`${to}T00:00:00Z`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start > end) return [];
  const requests: Promise<FmpDividend[]>[] = [];
  for (let cursor = start; cursor <= end; ) {
    const sliceEnd = addDays(cursor, 11);
    const sliceTo = sliceEnd < end ? sliceEnd : end;
    requests.push(getDividendCalendar(isoDate(cursor), isoDate(sliceTo)));
    cursor = addDays(sliceTo, 1);
  }
  const seen = new Set<string>();
  const out: FmpDividend[] = [];
  for (const rows of await Promise.all(requests)) {
    for (const row of rows) {
      const key = `${row.symbol}|${row.date}|${row.dividend}|${row.paymentDate}|${row.frequency}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(row);
    }
  }
  return out.sort((a, b) => a.date.localeCompare(b.date) || (a.symbol || "").localeCompare(b.symbol || ""));
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

export async function getLatestTechnical(
  symbol: string,
  indicator: "rsi" | "sma" | "ema",
  periodLength = 14,
) {
  const lookback = Math.max(periodLength * 2 + 20, 45);
  const from = isoDate(addDays(new Date(), -lookback));
  const rows = await fmpList<FmpTechnicalPoint>(
    `/technical-indicators/${indicator}`,
    { symbol: decodeTicker(symbol), periodLength, timeframe: "1day", from },
    { revalidate: 300 },
  );
  if (rows.length === 0) return null;
  return [...rows].sort((a, b) => b.date.localeCompare(a.date))[0];
}

export function getLatestRsi(symbol: string, periodLength = 14) {
  return getLatestTechnical(symbol, "rsi", periodLength);
}

export function getLatestSma(symbol: string, periodLength = 50) {
  return getLatestTechnical(symbol, "sma", periodLength);
}

export function getLatestEma(symbol: string, periodLength = 12) {
  return getLatestTechnical(symbol, "ema", periodLength);
}

export function getTechnicalSeries(
  symbol: string,
  indicator: "rsi" | "sma" | "ema",
  periodLength: number,
  from: string,
) {
  return fmpList<FmpTechnicalPoint>(
    `/technical-indicators/${indicator}`,
    { symbol: decodeTicker(symbol), periodLength, timeframe: "1day", from },
    { revalidate: 300 },
  );
}

export function getEtfList() {
  return fmpList<FmpEtfListItem>("/etf-list", {}, { revalidate: 86400 });
}

export async function getEtfSymbolSet() {
  const rows = await getEtfList();
  return new Set(rows.map((row) => row.symbol.toUpperCase()).filter(Boolean));
}

export async function listedUsEtfHolders(rows: FmpEtfExposure[]) {
  const etfs = await getEtfSymbolSet();
  return usEtfHolders(rows).filter((row) => etfs.has(decodeTicker(row.symbol)));
}

/** FMP historical EOD endpoints cap each response at 5,000 rows (newest first). */
const FMP_EOD_ROW_CAP = 5000;
const FMP_EOD_MAX_PAGES = 8;

async function fetchEodPages<T extends { date: string }>(
  fetchPage: (pageTo?: string) => Promise<T[]>,
  from?: string,
  to?: string,
) {
  const byDate = new Map<string, T>();
  let pageTo = to;
  for (let page = 0; page < FMP_EOD_MAX_PAGES; page++) {
    const rows = await fetchPage(pageTo);
    if (!rows.length) break;
    const sizeBefore = byDate.size;
    for (const row of rows) {
      const day = row.date?.slice(0, 10);
      if (day) byDate.set(day, row);
    }
    if (byDate.size === sizeBefore) break;
    const earliest = [...byDate.keys()].sort()[0];
    if (!earliest) break;
    if (from && earliest <= from) break;
    // FMP sometimes returns just under the 5,000-row cap. When a `from` bound
    // is still older than this page, keep walking `to=` slices.
    if (!from && rows.length < FMP_EOD_ROW_CAP) break;
    const nextTo = isoDate(addDays(new Date(`${earliest}T00:00:00Z`), -1));
    if (pageTo === nextTo) break;
    pageTo = nextTo;
  }
  return [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date));
}

export function getDailyChart(symbol: string, from?: string, to?: string) {
  const ticker = decodeTicker(symbol);
  return fetchEodPages(
    (pageTo) =>
      fmpList<FmpLightCandle>(
        "/historical-price-eod/light",
        { symbol: ticker, from, to: pageTo },
        { revalidate: 300 },
      ),
    from,
    to,
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

export function getBalanceSheetTtm(symbol: string) {
  return fmpFirst<FmpBalanceSheet>(
    "/balance-sheet-statement-ttm",
    { symbol: decodeTicker(symbol) },
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

export function getIncomeAsReported(symbol: string, period: StatementPeriod, limit = 8) {
  return fmpList<FmpAsReportedStatement>(
    "/income-statement-as-reported",
    { symbol: decodeTicker(symbol), period, limit },
    { revalidate: 3600 },
  );
}

export function getBalanceAsReported(symbol: string, period: StatementPeriod, limit = 8) {
  return fmpList<FmpAsReportedStatement>(
    "/balance-sheet-statement-as-reported",
    { symbol: decodeTicker(symbol), period, limit },
    { revalidate: 3600 },
  );
}

export function getCashFlowAsReported(symbol: string, period: StatementPeriod, limit = 8) {
  return fmpList<FmpAsReportedStatement>(
    "/cash-flow-statement-as-reported",
    { symbol: decodeTicker(symbol), period, limit },
    { revalidate: 3600 },
  );
}

export function getFinancialReportDates(symbol: string) {
  return fmpList<FmpFinancialReportDate>(
    "/financial-reports-dates",
    { symbol: decodeTicker(symbol) },
    { revalidate: 3600 },
  );
}

export async function getFinancialReportJson(symbol: string, year: string | number, period: string) {
  try {
    return await fmpGet<FmpFinancialReportJson>(
      "/financial-reports-json",
      { symbol: decodeTicker(symbol), year, period },
      { revalidate: 86400 },
    );
  } catch (error) {
    if (error instanceof FmpError && error.status === 401) return null;
    console.error("FMP /financial-reports-json failed", error);
    return null;
  }
}

export async function getFinancialReportXlsx(symbol: string, year: string, period: string) {
  await connection();
  const key = process.env.FMP_API_KEY?.trim();
  if (!key) return null;
  const url = new URL(`${FMP_BASE}/financial-reports-xlsx`);
  url.searchParams.set("symbol", decodeTicker(symbol));
  url.searchParams.set("year", year);
  url.searchParams.set("period", period);
  url.searchParams.set("apikey", key);
  const response = await fetch(url.toString(), { next: { revalidate: 86400 } });
  if (!response.ok) return null;
  const buffer = await response.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  const isZip = bytes.length >= 2 && bytes[0] === 0x50 && bytes[1] === 0x4b;
  if (!isZip) return null;
  return buffer;
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

export function getPriceTargetNews(symbol: string, limit = 20, page = 0) {
  return fmpList<FmpPriceTargetNews>(
    "/price-target-news",
    { symbol: decodeTicker(symbol), page, limit },
    { revalidate: 300 },
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

export function getEstimates(symbol: string, period: StatementPeriod = "annual", limit = 16) {
  return fmpList<FmpEstimate>(
    "/analyst-estimates",
    { symbol: decodeTicker(symbol), period, limit },
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

export async function getScreenerArchive(
  params: Record<string, QueryValue> = {},
  { pages = 5, limit = 1000, revalidate = 1800 }: { pages?: number; limit?: number; revalidate?: number } = {},
) {
  const batches = await Promise.all(
    Array.from({ length: pages }, (_, page) => getScreener(params, { page, limit, revalidate })),
  );
  return uniqueBySymbol(batches.flat());
}

export async function getListedUsStocks() {
  const [nasdaq, nyse, amex] = await Promise.all([
    getScreenerArchive({ exchange: "NASDAQ", isEtf: false, isFund: false }, { pages: 5 }),
    getScreenerArchive({ exchange: "NYSE", isEtf: false, isFund: false }, { pages: 3 }),
    getScreenerArchive({ exchange: "AMEX", isEtf: false, isFund: false }, { pages: 1 }),
  ]);
  return uniqueBySymbol([...nasdaq, ...nyse, ...amex]);
}

export async function getListedUsEtfs() {
  return listedUsRows(
    await getScreenerArchive({ country: "US", isEtf: true, isFund: false }, { pages: 5 }),
  );
}

export async function getListedUsFunds() {
  return listedUsRows(
    await getScreenerArchive({ country: "US", isEtf: false, isFund: true }, { pages: 5 }),
  );
}

export function getFundDisclosureHolders(symbol: string) {
  return fmpList<FmpFundDisclosureHolder>(
    "/funds/disclosure-holders-latest",
    { symbol: decodeTicker(symbol) },
    { revalidate: 3600 },
  );
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

export function getAllExchangeHours() {
  return fmpList<FmpMarketHours>("/all-exchange-market-hours", {}, { revalidate: 60 });
}

export function getAvailableExchanges() {
  return fmpList<FmpExchangeInfo>("/available-exchanges", {}, { revalidate: 86400 });
}

export function getExchangeHolidays(exchange = "NASDAQ") {
  return fmpList<FmpExchangeHoliday>(
    "/holidays-by-exchange",
    { exchange },
    { revalidate: 86400 },
  );
}

export function getIndexList() {
  return fmpList<FmpIndexListItem>("/index-list", {}, { revalidate: 86400 });
}

export function getBatchIndexQuotes() {
  return fmpList<FmpCommodityQuote>("/batch-index-quotes", {}, { revalidate: 30 });
}

export function getBeneficialOwnership(symbol: string) {
  return fmpList<FmpBeneficialOwner>(
    "/acquisition-of-beneficial-ownership",
    { symbol: decodeTicker(symbol) },
    { revalidate: 3600 },
  );
}

export function getSecProfile(symbol: string) {
  return fmpFirst<FmpSecProfile>(
    "/sec-profile",
    { symbol: decodeTicker(symbol) },
    { revalidate: 86400 },
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

export function getInsiderTrades(symbol: string, limit = 50, page = 0) {
  return fmpList<FmpInsiderTrade>(
    "/insider-trading/search",
    { symbol: decodeTicker(symbol), page, limit },
    { revalidate: 300 },
  );
}

const FMP_INSIDER_PAGE_SIZE = 100;
const FMP_INSIDER_MAX_PAGES = 65;

/** Newest-first Form 4 search; sixty-five FMP pages take AAPL through May 2003. */
export async function getInsiderTradesArchive(symbol: string) {
  const pages = await Promise.all(
    Array.from({ length: FMP_INSIDER_MAX_PAGES }, (_, page) =>
      getInsiderTrades(symbol, FMP_INSIDER_PAGE_SIZE, page),
    ),
  );
  const seen = new Set<string>();
  const out: FmpInsiderTrade[] = [];
  for (const rows of pages) {
    for (const row of rows) {
      const key = `${row.filingDate}|${row.transactionDate}|${row.reportingCik}|${row.securitiesTransacted}|${row.price}|${row.transactionType}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(row);
    }
  }
  return out;
}

export function searchInsiderTrades(params: {
  symbol?: string;
  reportingCik?: string;
  limit?: number;
  page?: number;
}) {
  return fmpList<FmpInsiderTrade>(
    "/insider-trading/search",
    {
      symbol: params.symbol ? decodeTicker(params.symbol) : undefined,
      reportingCik: params.reportingCik || undefined,
      page: params.page ?? 0,
      limit: params.limit ?? 50,
    },
    { revalidate: 300 },
  );
}

export function getInsiderReportingNames(name: string) {
  return fmpList<FmpInsiderReportingName>(
    "/insider-trading/reporting-name",
    { name },
    { revalidate: 600 },
  );
}

export function getInsiderStatistics(symbol: string) {
  return fmpList<FmpInsiderStatistics>(
    "/insider-trading/statistics",
    { symbol: decodeTicker(symbol) },
    { revalidate: 3600 },
  );
}

export function getLatestInsiderTrades(limit = 50, page = 0) {
  return fmpList<FmpInsiderTrade>(
    "/insider-trading/latest",
    { page, limit },
    { revalidate: 120 },
  );
}

const FMP_HUB_PAGE_SIZE = 100;
/** Senate net worth; other hubs have their own page caps. */
const FMP_HUB_MAX_PAGES = 4;
const FMP_PRICE_TARGET_NEWS_PAGES = 6;
const FMP_INSIDER_HUB_PAGES = 79;
const FMP_TRANSCRIPT_HUB_PAGES = 61;
const FMP_GRADES_NEWS_PAGES = 83;
const FMP_INSTITUTIONAL_HUB_PAGES = 83;
const FMP_SEC_8K_HUB_PAGES = 14;
const FMP_SEC_FINANCIALS_HUB_PAGES = 7;

export async function getLatestInsiderTradesArchive() {
  const pages = await Promise.all(
    Array.from({ length: FMP_INSIDER_HUB_PAGES }, (_, page) => getLatestInsiderTrades(FMP_HUB_PAGE_SIZE, page)),
  );
  return mergeInsiderPages(pages);
}

export async function searchInsiderTradesArchive(reportingCik: string) {
  const pages = await Promise.all(
    Array.from({ length: FMP_INSIDER_HUB_PAGES }, (_, page) =>
      searchInsiderTrades({ reportingCik, limit: FMP_HUB_PAGE_SIZE, page }),
    ),
  );
  return mergeInsiderPages(pages);
}

function mergeInsiderPages(pages: FmpInsiderTrade[][]) {
  const seen = new Set<string>();
  const out: FmpInsiderTrade[] = [];
  for (const rows of pages) {
    for (const row of rows) {
      const key = `${row.filingDate}|${row.transactionDate}|${row.reportingCik}|${row.symbol}|${row.securitiesTransacted}|${row.price}|${row.transactionType}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(row);
    }
  }
  return out;
}

export function getSenateLatest(limit = 100, page = 0) {
  return fmpList<FmpCongressTrade>("/senate-latest", { page, limit }, { revalidate: 300 });
}

export function getHouseLatest(limit = 100, page = 0) {
  return fmpList<FmpCongressTrade>("/house-latest", { page, limit }, { revalidate: 300 });
}

export function getSenateTrades(symbol: string, limit = 50, page = 0) {
  return fmpList<FmpCongressTrade>(
    "/senate-trades",
    { symbol: decodeTicker(symbol), page, limit },
    { revalidate: 600 },
  );
}

export function getHouseTrades(symbol: string, limit = 50, page = 0) {
  return fmpList<FmpCongressTrade>(
    "/house-trades",
    { symbol: decodeTicker(symbol), page, limit },
    { revalidate: 600 },
  );
}

export function getSenateTradesByName(name: string) {
  return fmpList<FmpCongressTrade>("/senate-trades-by-name", { name }, { revalidate: 600 });
}

export function getHouseTradesByName(name: string) {
  return fmpList<FmpCongressTrade>("/house-trades-by-name", { name }, { revalidate: 600 });
}

export function getSenateProfile(senateID: string) {
  return fmpFirst<FmpSenateProfile>("/senate-profile", { senateID }, { revalidate: 86400 });
}

export function getSenatePositions(senateID: string) {
  return fmpList<FmpSenatePosition>(
    "/senate-positions",
    { senateID },
    { revalidate: 86400 },
  );
}

export function getSenateNetWorth(senateID: string, page = 0, limit = 250) {
  return fmpList<FmpSenateNetWorth>(
    "/senate-net-worth",
    { senateID, page, limit },
    { revalidate: 86400 },
  );
}

export async function getSenateNetWorthArchive(senateID: string) {
  const pages = await Promise.all(
    Array.from({ length: FMP_HUB_MAX_PAGES }, (_, page) => getSenateNetWorth(senateID, page, 250)),
  );
  const seen = new Set<string>();
  const out: FmpSenateNetWorth[] = [];
  for (const rows of pages) {
    for (const row of rows) {
      const key = `${row.year}|${row.section}|${row.category}|${row.name}|${row.value}|${row.link}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(row);
    }
  }
  return out.sort((a, b) => (b.year || 0) - (a.year || 0) || (b.filingDate || "").localeCompare(a.filingDate || ""));
}

export function getLatestFinancialStatements(page = 0, limit = 100) {
  return fmpList<FmpLatestStatement>(
    "/latest-financial-statements",
    { page, limit },
    { revalidate: 120 },
  );
}

const FMP_STATEMENT_PAGE_SIZE = 100;
const FMP_STATEMENT_MAX_PAGES = 37;

/** Newest-first ingest feed; thirty-seven pages cover about two calendar days of additions. */
export async function getLatestFinancialStatementsArchive() {
  const pages = await Promise.all(
    Array.from({ length: FMP_STATEMENT_MAX_PAGES }, (_, page) =>
      getLatestFinancialStatements(page, FMP_STATEMENT_PAGE_SIZE),
    ),
  );
  const seen = new Set<string>();
  const out: FmpLatestStatement[] = [];
  for (const rows of pages) {
    for (const row of rows) {
      const key = `${row.symbol}|${row.period}|${row.date}|${row.dateAdded}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(row);
    }
  }
  return out.sort(
    (a, b) => (b.dateAdded || "").localeCompare(a.dateAdded || "") || a.symbol.localeCompare(b.symbol),
  );
}

export function getLatestSecFilings8k(from: string, to: string, limit = 100, page = 0) {
  return fmpList<FmpSecFiling>(
    "/sec-filings-8k",
    { from, to, page, limit },
    { revalidate: 120 },
  );
}

export function getLatestSecFilingsFinancials(from: string, to: string, limit = 100, page = 0) {
  return fmpList<FmpSecFiling>(
    "/sec-filings-financials",
    { from, to, page, limit },
    { revalidate: 120 },
  );
}

export async function getLatestSecFilingsArchive(from: string, to: string) {
  const [eightKPages, financialPages] = await Promise.all([
    Promise.all(Array.from({ length: FMP_SEC_8K_HUB_PAGES }, (_, page) => getLatestSecFilings8k(from, to, FMP_HUB_PAGE_SIZE, page))),
    Promise.all(
      Array.from({ length: FMP_SEC_FINANCIALS_HUB_PAGES }, (_, page) =>
        getLatestSecFilingsFinancials(from, to, FMP_HUB_PAGE_SIZE, page),
      ),
    ),
  ]);
  const seen = new Set<string>();
  const rows: FmpSecFiling[] = [];
  for (const row of [...eightKPages.flat(), ...financialPages.flat()]) {
    const key = `${row.symbol}|${row.formType}|${row.acceptedDate || row.filingDate}|${row.link}`;
    if (seen.has(key)) continue;
    seen.add(key);
    rows.push(row);
  }
  return rows.sort((a, b) =>
    (b.acceptedDate || b.filingDate || "").localeCompare(a.acceptedDate || a.filingDate || ""),
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
  const ticker = decodeTicker(symbol);
  const pageLimit = Math.min(Math.max(limit, 1), FMP_EOD_ROW_CAP);
  return fetchEodPages(
    (pageTo) =>
      fmpList<FmpHistoricalMarketCap>(
        "/historical-market-capitalization",
        { symbol: ticker, limit: pageLimit, from, to: pageTo },
        { revalidate: 3600 },
      ),
    from,
    to,
  ).then((rows) => [...rows].sort((a, b) => b.date.localeCompare(a.date)));
}

/** Closest daily market cap to today−365, from a small date window (not the full history). */
export async function getYearAgoMarketCap(symbol: string) {
  const today = new Date(`${nyDateString()}T00:00:00Z`);
  const target = isoDate(addDays(today, -365));
  const from = isoDate(addDays(today, -375));
  const to = isoDate(addDays(today, -355));
  const rows = await getHistoricalMarketCap(symbol, 40, from, to);
  if (!rows.length) return null;
  const targetMs = Date.parse(`${target}T00:00:00Z`);
  return (
    [...rows].sort((a, b) => {
      const da = Math.abs(Date.parse(`${a.date.slice(0, 10)}T00:00:00Z`) - targetMs);
      const db = Math.abs(Date.parse(`${b.date.slice(0, 10)}T00:00:00Z`) - targetMs);
      return da - db;
    })[0] ?? null
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
  const ticker = decodeTicker(symbol);
  return fetchEodPages(
    (pageTo) =>
      fmpList<FmpFullCandle>(
        "/historical-price-eod/full",
        { symbol: ticker, from, to: pageTo },
        { revalidate: 300 },
      ),
    from,
    to,
  );
}

export function getDividendAdjustedChart(symbol: string, from?: string, to?: string) {
  const ticker = decodeTicker(symbol);
  return fetchEodPages(
    (pageTo) =>
      fmpList<FmpAdjustedCandle>(
        "/historical-price-eod/dividend-adjusted",
        { symbol: ticker, from, to: pageTo },
        { revalidate: 300 },
      ),
    from,
    to,
  );
}

export function getSecFilings(symbol: string, from: string, to: string, limit = 50, page = 0) {
  return fmpList<FmpSecFiling>(
    "/sec-filings-search/symbol",
    { symbol: decodeTicker(symbol), from, to, page, limit },
    { revalidate: 600 },
  );
}

const FMP_SEC_PAGE_SIZE = 100;
const FMP_SEC_MAX_PAGES = 27;

/** Newest-first SEC search is Form-4 heavy; page 8+ needs `from`, which callers always pass. */
export async function getSecFilingsArchive(symbol: string, from: string, to: string) {
  const pages = await Promise.all(
    Array.from({ length: FMP_SEC_MAX_PAGES }, (_, page) =>
      getSecFilings(symbol, from, to, FMP_SEC_PAGE_SIZE, page),
    ),
  );
  const seen = new Set<string>();
  const out: FmpSecFiling[] = [];
  for (const rows of pages) {
    for (const row of rows) {
      const key = `${row.formType}|${row.acceptedDate}|${row.link}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(row);
    }
  }
  return out;
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

export function getLatestTranscripts(limit = 30, page = 0) {
  return fmpList<FmpTranscriptDate & { symbol: string; period?: string }>(
    "/earning-call-transcript-latest",
    { limit, page },
    { revalidate: 300 },
  );
}

export async function getLatestTranscriptsArchive() {
  const pages = await Promise.all(
    Array.from({ length: FMP_TRANSCRIPT_HUB_PAGES }, (_, page) => getLatestTranscripts(FMP_HUB_PAGE_SIZE, page)),
  );
  const seen = new Set<string>();
  const out: Array<FmpTranscriptDate & { symbol: string; period?: string }> = [];
  for (const rows of pages) {
    for (const row of rows) {
      const key = `${row.symbol}|${row.fiscalYear}|${row.quarter ?? row.period}|${row.date}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(row);
    }
  }
  return out;
}

export function getEconomicCalendar(from: string, to: string, country = "US") {
  return fmpList<FmpEconomicEvent>(
    "/economic-calendar",
    { from, to, country },
    { revalidate: 300 },
  );
}

function isPlausible13F(row: FmpInstitutionalSummary) {
  if (row.ownershipPercent > 95) {
    const prevPct = row.lastOwnershipPercent;
    if (typeof prevPct === "number" && prevPct > 0 && row.ownershipPercent - prevPct > 20) {
      return false;
    }
    const previous = row.lastNumberOf13Fshares;
    if (typeof previous === "number" && previous > 0 && row.numberOf13Fshares / previous > 1.75) {
      return false;
    }
  }
  return true;
}

async function findLatestInstitutionalSummary(symbol: string) {
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
      return { summary: row, year: period.year, quarter: period.quarter };
    }
    backup ??= { ...period, row };
  }

  if (!backup) {
    return { summary: null, year: null, quarter: null };
  }
  return { summary: backup.row, year: backup.year, quarter: backup.quarter };
}

export async function getInstitutionalOwnershipHistory(symbol: string, quarters = 16) {
  const ticker = decodeTicker(symbol);
  const periods = recentFiscalQuarters(quarters);
  const batches = await Promise.all(
    periods.map((period) =>
      fmpList<FmpInstitutionalSummary>(
        "/institutional-ownership/symbol-positions-summary",
        { symbol: ticker, year: period.year, quarter: period.quarter },
        { revalidate: 3600 },
      ).then((rows) => ({ period, row: rows[0] ?? null })),
    ),
  );
  return batches
    .filter((item): item is { period: { year: number; quarter: number }; row: FmpInstitutionalSummary } =>
      Boolean(item.row && isPlausible13F(item.row)),
    )
    .map((item) => ({ year: item.period.year, quarter: item.period.quarter, row: item.row }));
}

const FMP_HOLDER_PAGE_SIZE = 100;

export async function getInstitutionalHoldersPage(
  symbol: string,
  year: number,
  quarter: number,
  page = 1,
  pageSize = 50,
) {
  const ticker = decodeTicker(symbol);
  const start = Math.max(0, (page - 1) * pageSize);
  const fmpPage = Math.floor(start / FMP_HOLDER_PAGE_SIZE);
  const offset = start % FMP_HOLDER_PAGE_SIZE;
  const rows = await fmpList<FmpInstitutionalHolder>(
    "/institutional-ownership/extract-analytics/holder",
    { symbol: ticker, year, quarter, page: fmpPage, limit: FMP_HOLDER_PAGE_SIZE },
    { revalidate: 3600 },
  );
  return rows.slice(offset, offset + pageSize);
}

export async function getLatestInstitutionalOwnership(
  symbol: string,
  options: { holders?: boolean; page?: number; pageSize?: number } | number = {},
) {
  const ticker = decodeTicker(symbol);
  const latest = await findLatestInstitutionalSummary(ticker);
  const includeHolders = typeof options === "number" ? options > 0 : options.holders !== false;
  const requestedPage = typeof options === "number" ? 1 : (options.page ?? 1);
  const pageSize =
    typeof options === "number" ? (options > 0 ? options : 50) : (options.pageSize ?? 50);
  const holderTotal = latest.summary?.investorsHolding ?? 0;
  if (!latest.summary || !includeHolders || latest.year == null || latest.quarter == null || holderTotal === 0) {
    return { ...latest, holders: [] as FmpInstitutionalHolder[], holderTotal };
  }
  const pageCount = Math.max(1, Math.ceil(holderTotal / pageSize) || 1);
  const page = Math.min(Math.max(requestedPage, 1), pageCount);
  const holders = await getInstitutionalHoldersPage(ticker, latest.year, latest.quarter, page, pageSize);
  return { ...latest, holders, holderTotal };
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

export function getGradesLatestNews(limit = 80, page = 0) {
  return fmpList<FmpGradeNews>(
    "/grades-latest-news",
    { page, limit },
    { revalidate: 120 },
  );
}

export async function getGradesLatestNewsArchive() {
  const pages = await Promise.all(
    Array.from({ length: FMP_GRADES_NEWS_PAGES }, (_, page) => getGradesLatestNews(FMP_HUB_PAGE_SIZE, page)),
  );
  const seen = new Set<string>();
  const out: FmpGradeNews[] = [];
  for (const rows of pages) {
    for (const row of rows) {
      const key = `${row.symbol}|${row.publishedDate}|${row.gradingCompany}|${row.action}|${row.newsURL}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(row);
    }
  }
  return out;
}

export async function getPriceTargetNewsArchive(symbol: string) {
  const ticker = decodeTicker(symbol);
  const pages = await Promise.all(
    Array.from({ length: FMP_PRICE_TARGET_NEWS_PAGES }, (_, page) => getPriceTargetNews(ticker, 50, page)),
  );
  const seen = new Set<string>();
  const out: FmpPriceTargetNews[] = [];
  for (const rows of pages) {
    for (const row of rows) {
      const key = row.newsURL || `${row.publishedDate}|${row.analystCompany}|${row.newsTitle}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(row);
    }
  }
  return out;
}

export function getCommoditiesList() {
  return fmpList<FmpCommodity>("/commodities-list", {}, { revalidate: 86400 });
}

/** CFTC positioning. Omit `from`/`to` and FMP returns a 2024 snapshot instead of the latest week. */
export function getCotAnalysis(from: string, to: string, symbol?: string) {
  return fmpList<FmpCotAnalysis>(
    "/commitment-of-traders-analysis",
    { from, to, symbol: symbol || undefined },
    { revalidate: 3600 },
  );
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

export function getLatestMergers(limit = 50, page = 0) {
  return fmpList<FmpMerger>(
    "/mergers-acquisitions-latest",
    { page, limit },
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

export function getEsgBenchmark(year?: number) {
  return fmpList<FmpEsgBenchmark>(
    "/esg-benchmark",
    year != null ? { year } : {},
    { revalidate: 86400 },
  );
}

export async function getEsgBenchmarks(years = 3) {
  const latest = new Date().getUTCFullYear();
  const batches = await Promise.all(
    Array.from({ length: years }, (_, index) => getEsgBenchmark(latest - index)),
  );
  return batches.flat();
}

export function getMarketRiskPremium() {
  return fmpList<FmpMarketRiskPremium>("/market-risk-premium", {}, { revalidate: 86400 });
}

export function getCompanyNotes(symbol: string) {
  return fmpList<FmpCompanyNote>(
    "/company-notes",
    { symbol: decodeTicker(symbol) },
    { revalidate: 86400 },
  );
}

export function getLatestInstitutionalFilings(limit = 80, page = 0) {
  return fmpList<FmpInstitutionalFiling>(
    "/institutional-ownership/latest",
    { page, limit },
    { revalidate: 300 },
  );
}

export async function getLatestInstitutionalFilingsArchive() {
  const pages = await Promise.all(
    Array.from({ length: FMP_INSTITUTIONAL_HUB_PAGES }, (_, page) =>
      getLatestInstitutionalFilings(FMP_HUB_PAGE_SIZE, page),
    ),
  );
  const seen = new Set<string>();
  const out: FmpInstitutionalFiling[] = [];
  for (const rows of pages) {
    for (const row of rows) {
      if (!row.name || !row.cik) continue;
      const key = `${row.cik}|${row.filingDate}|${row.formType}|${row.date}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(row);
    }
  }
  return out;
}

export function getInstitutionalDates(cik: string) {
  return fmpList<FmpInstitutionalDate>(
    "/institutional-ownership/dates",
    { cik },
    { revalidate: 3600 },
  );
}

export function getInstitutionalExtract(cik: string, year: number, quarter: number) {
  return fmpList<FmpInstitutionalExtract>(
    "/institutional-ownership/extract",
    { cik, year, quarter },
    { revalidate: 3600 },
  );
}

export function getInstitutionalPerformance(cik: string) {
  return fmpList<FmpInstitutionalPerformance>(
    "/institutional-ownership/holder-performance-summary",
    { cik },
    { revalidate: 3600 },
  );
}

export function getInstitutionalIndustryBreakdown(cik: string, year: number, quarter: number) {
  return fmpList<FmpInstitutionalIndustry>(
    "/institutional-ownership/holder-industry-breakdown",
    { cik, year, quarter },
    { revalidate: 3600 },
  );
}

export function getExchangeVariants(symbol: string) {
  return fmpList<FmpExchangeVariant>(
    "/search-exchange-variants",
    { symbol: decodeTicker(symbol) },
    { revalidate: 86400 },
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

export { INDEX_SYMBOLS, WORLD_INDEX_SYMBOLS };

export function getIndexQuotes() {
  return getQuotes(INDEX_SYMBOLS.map((item) => item.symbol));
}

export function getWorldIndexQuotes() {
  return getQuotes(WORLD_INDEX_SYMBOLS.map((item) => item.symbol));
}
