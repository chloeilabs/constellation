import { getDividendCalendar, getIndexConstituents, getQuotes, getScreener } from "@/lib/fmp";
import { isForeignListingSymbol, parseFoundedYear, preferPrimaryListings, uniqueBySymbol } from "@/lib/listings";
import { addDays, annualDividendPayments, isoDate, nyDateString } from "@/lib/utils";
import type { SymbolTableRow } from "@/components/symbol-table";
import type { FmpScreenerRow } from "@/lib/types";

type ListCategory = "popular" | "index" | "exchange" | "market-cap" | "etf" | "international";

type ScreenerList = {
  title: string;
  description: string;
  category: ListCategory;
  source: "screener";
  filters: Record<string, string | number | boolean>;
  limit: number;
  sort?: "marketCap" | "dividendYield" | "volume";
  listing?: "primary" | "raw";
  hrefBase?: "/stocks" | "/etf";
  yieldMax?: number;
  symbolPattern?: string;
  capMax?: number;
};

type ConstituentList = {
  title: string;
  description: string;
  category: ListCategory;
  source: "constituents";
  index: "sp500" | "nasdaq" | "dow";
};

type CalendarList = {
  title: string;
  description: string;
  category: ListCategory;
  source: "monthly-dividends";
};

type OldestList = {
  title: string;
  description: string;
  category: ListCategory;
  source: "oldest";
};

type OtcList = {
  title: string;
  description: string;
  category: ListCategory;
  source: "otc";
};

type ForeignList = {
  title: string;
  description: string;
  category: ListCategory;
  source: "foreign-us";
};

type SymbolsList = {
  title: string;
  description: string;
  category: ListCategory;
  source: "symbols";
  symbols: readonly string[];
};

type EtfIssuerList = {
  title: string;
  description: string;
  category: ListCategory;
  source: "etf-issuer";
  namePattern: string;
  hrefBase: "/etf";
};

type WeekRangeList = {
  title: string;
  description: string;
  category: ListCategory;
  source: "week-range";
  direction: "high" | "low";
};

type StockList =
  | ScreenerList
  | ConstituentList
  | CalendarList
  | OldestList
  | OtcList
  | ForeignList
  | SymbolsList
  | EtfIssuerList
  | WeekRangeList;

export const STOCK_LISTS = {
  "sp-500-stocks": {
    title: "S&P 500 Stocks",
    description: "Companies in the S&P 500, ranked by market capitalization.",
    category: "index",
    source: "constituents",
    index: "sp500",
  },
  "nasdaq-100-stocks": {
    title: "Nasdaq 100 Stocks",
    description: "The Nasdaq-100 constituents, ranked by market capitalization.",
    category: "index",
    source: "constituents",
    index: "nasdaq",
  },
  "dow-jones-stocks": {
    title: "Dow Jones Stocks",
    description: "The 30 companies in the Dow Jones Industrial Average.",
    category: "index",
    source: "constituents",
    index: "dow",
  },
  "biggest-companies": {
    title: "Biggest Companies",
    description: "The largest U.S. companies ranked by market capitalization.",
    category: "popular",
    source: "screener",
    filters: { country: "US" },
    limit: 100,
    sort: "marketCap",
  },
  "oldest-companies": {
    title: "Oldest S&P 500 Companies",
    description: "The 100 oldest companies in the S&P 500, ranked by founding year from FMP constituent data.",
    category: "popular",
    source: "oldest",
  },
  "highest-dividend": {
    title: "Highest Dividend Stocks",
    description: "U.S. stocks with the highest indicated dividend yield.",
    category: "popular",
    source: "screener",
    filters: { country: "US", dividendMoreThan: 0.01 },
    limit: 400,
    sort: "dividendYield",
  },
  "monthly-dividend-stocks": {
    title: "Monthly Dividend Stocks",
    description: "U.S. stocks that currently pay a monthly dividend, ranked by indicated yield.",
    category: "popular",
    source: "monthly-dividends",
  },
  "foreign-stocks": {
    title: "Foreign Stocks on U.S. Exchanges",
    description: "The largest non-U.S. companies listed on the NYSE, NASDAQ, or NYSE American.",
    category: "popular",
    source: "foreign-us",
  },
  "nasdaq-stocks": {
    title: "NASDAQ Stocks",
    description: "The largest companies listed on the NASDAQ.",
    category: "exchange",
    source: "screener",
    filters: { country: "US", exchange: "NASDAQ" },
    limit: 100,
    sort: "marketCap",
  },
  "nyse-stocks": {
    title: "NYSE Stocks",
    description: "The largest companies listed on the New York Stock Exchange.",
    category: "exchange",
    source: "screener",
    filters: { country: "US", exchange: "NYSE" },
    limit: 100,
    sort: "marketCap",
  },
  "nyse-american-stocks": {
    title: "NYSE American Stocks",
    description: "The largest companies listed on NYSE American (AMEX).",
    category: "exchange",
    source: "screener",
    filters: { country: "US", exchange: "AMEX" },
    limit: 100,
    sort: "marketCap",
  },
  "otc-stocks": {
    title: "OTC Stocks",
    description: "The largest U.S. companies quoted on OTC Markets, ranked by market capitalization.",
    category: "exchange",
    source: "otc",
  },
  "mega-cap-stocks": {
    title: "Mega-Cap Stocks",
    description: "U.S. companies with a market cap of $200 billion or more.",
    category: "market-cap",
    source: "screener",
    filters: { country: "US", marketCapMoreThan: 200_000_000_000 },
    limit: 100,
    sort: "marketCap",
  },
  "large-cap-stocks": {
    title: "Large-Cap Stocks",
    description: "U.S. companies with a market cap between $10 billion and $200 billion.",
    category: "market-cap",
    source: "screener",
    filters: { country: "US", marketCapMoreThan: 10_000_000_000, marketCapLowerThan: 200_000_000_000 },
    limit: 100,
    sort: "marketCap",
  },
  "mid-cap-stocks": {
    title: "Mid-Cap Stocks",
    description: "U.S. companies with a market cap between $2 billion and $10 billion.",
    category: "market-cap",
    source: "screener",
    filters: { country: "US", marketCapMoreThan: 2_000_000_000, marketCapLowerThan: 10_000_000_000 },
    limit: 100,
    sort: "marketCap",
  },
  "small-cap-stocks": {
    title: "Small-Cap Stocks",
    description: "U.S. companies with a market cap between $300 million and $2 billion.",
    category: "market-cap",
    source: "screener",
    filters: { country: "US", marketCapMoreThan: 300_000_000, marketCapLowerThan: 2_000_000_000 },
    limit: 100,
    sort: "marketCap",
  },
  "dividend-etfs": {
    title: "Dividend ETFs",
    description: "U.S. ETFs ranked by indicated dividend yield from FMP screener data.",
    category: "etf",
    source: "screener",
    filters: { isEtf: true, isFund: false, country: "US", dividendMoreThan: 0.01 },
    limit: 200,
    sort: "dividendYield",
    listing: "primary",
    hrefBase: "/etf",
    yieldMax: 0.15,
  },
  "bond-etfs": {
    title: "Bond ETFs",
    description: "The largest U.S. fixed-income ETFs, ranked by market value.",
    category: "etf",
    source: "screener",
    filters: { isEtf: true, isFund: false, country: "US", industry: "Asset Management - Bonds" },
    limit: 100,
    sort: "marketCap",
    listing: "primary",
    hrefBase: "/etf",
  },
  "income-etfs": {
    title: "Equity Income ETFs",
    description: "U.S. equity-income ETFs, including covered-call and high-dividend funds.",
    category: "etf",
    source: "screener",
    filters: { isEtf: true, isFund: false, country: "US", industry: "Asset Management - Income" },
    limit: 100,
    sort: "dividendYield",
    listing: "primary",
    hrefBase: "/etf",
    yieldMax: 0.15,
  },
  "crypto-etfs": {
    title: "Crypto ETFs",
    description: "U.S. bitcoin, ether, and other digital-asset ETFs ranked by market value.",
    category: "etf",
    source: "screener",
    filters: { isEtf: true, isFund: false, country: "US", industry: "Asset Management - Cryptocurrency" },
    limit: 100,
    sort: "marketCap",
    listing: "primary",
    hrefBase: "/etf",
  },
  "leveraged-etfs": {
    title: "Leveraged ETFs",
    description: "U.S. leveraged and inverse equity ETFs, ranked by market value.",
    category: "etf",
    source: "screener",
    filters: { isEtf: true, isFund: false, country: "US", industry: "Asset Management - Leveraged" },
    limit: 100,
    sort: "marketCap",
    listing: "primary",
    hrefBase: "/etf",
    capMax: 40_000_000_000,
  },
  "penny-stocks": {
    title: "Penny Stocks",
    description: "U.S.-listed companies trading below $5, ranked by market capitalization.",
    category: "popular",
    source: "screener",
    filters: { country: "US", priceMoreThan: 0.5, priceLowerThan: 5, marketCapMoreThan: 50_000_000 },
    limit: 200,
    sort: "marketCap",
    listing: "primary",
  },
  "high-beta-stocks": {
    title: "High-Beta Stocks",
    description: "U.S. stocks with a beta of 2 or higher, ranked by market capitalization.",
    category: "popular",
    source: "screener",
    filters: { country: "US", betaMoreThan: 2 },
    limit: 200,
    sort: "marketCap",
    listing: "primary",
  },
  "highest-volume": {
    title: "Highest Volume Stocks",
    description: "U.S. stocks with the highest regular-session volume, excluding micro-caps.",
    category: "popular",
    source: "screener",
    filters: { country: "US", volumeMoreThan: 5_000_000, marketCapMoreThan: 500_000_000 },
    limit: 200,
    sort: "volume",
    listing: "primary",
  },
  "magnificent-seven": {
    title: "Magnificent Seven",
    description: "Apple, Microsoft, Nvidia, Amazon, Alphabet, Meta, and Tesla, with live FMP quotes.",
    category: "popular",
    source: "symbols",
    symbols: ["NVDA", "AAPL", "MSFT", "GOOGL", "AMZN", "META", "TSLA"],
  },
  "52-week-high": {
    title: "52-Week Highs",
    description: "U.S. stocks trading closest to their 52-week high, from live FMP quotes.",
    category: "popular",
    source: "week-range",
    direction: "high",
  },
  "52-week-low": {
    title: "52-Week Lows",
    description: "U.S. stocks trading closest to their 52-week low, from live FMP quotes.",
    category: "popular",
    source: "week-range",
    direction: "low",
  },
  "dividend-aristocrats": {
    title: "Dividend Aristocrats",
    description: "S&P 500 companies known for 25+ years of dividend increases, with live FMP quotes.",
    category: "popular",
    source: "symbols",
    symbols: [
      "AOS", "ABT", "ABBV", "AFL", "APD", "ALB", "AMCR", "ADM", "ATO", "ADP",
      "BDX", "BRO", "BF.B", "CAH", "CAT", "CHRW", "CVX", "CINF", "CTAS", "CLX",
      "KO", "CL", "ED", "DOV", "ECL", "EMR", "ESS", "EXPD", "XOM", "FAST",
      "FRT", "BEN", "GD", "GPC", "HRL", "ITW", "IBM", "SJM", "JNJ", "KVUE",
      "KMB", "LIN", "LOW", "MKC", "MCD", "MDT", "NUE", "NDSN", "NEE", "O",
      "PEP", "PNR", "PPG", "PG", "ROP", "SPGI", "SHW", "SWK", "SYY", "TROW",
      "TGT", "WMT", "GWW", "WST", "CHD",
    ],
  },
  "dividend-kings": {
    title: "Dividend Kings",
    description: "U.S. companies known for 50+ years of dividend increases, with live FMP quotes.",
    category: "popular",
    source: "symbols",
    symbols: [
      "KO", "JNJ", "PG", "MMM", "EMR", "GPC", "CINF", "SWK", "DOV", "ITW",
      "PPG", "CL", "HRL", "FRT", "ED", "LOW", "ABT", "KMB", "PEP", "TGT",
      "WMT", "SYY", "GWW", "ADP", "NUE", "APD", "PH", "NDSN", "SJM", "CLX",
      "MO", "BDX", "AFL", "CBSH", "FUL", "MSA", "NJR", "UGI", "CWT", "AWR",
    ],
  },
  "vanguard-etfs": {
    title: "Vanguard ETFs",
    description: "The largest U.S. Vanguard ETFs, ranked by market value from the FMP screener.",
    category: "etf",
    source: "etf-issuer",
    namePattern: "vanguard",
    hrefBase: "/etf",
  },
  "ishares-etfs": {
    title: "iShares ETFs",
    description: "The largest U.S. iShares ETFs, ranked by market value from the FMP screener.",
    category: "etf",
    source: "etf-issuer",
    namePattern: "ishares",
    hrefBase: "/etf",
  },
  "spdr-etfs": {
    title: "SPDR ETFs",
    description: "The largest U.S. State Street SPDR ETFs, ranked by market value from the FMP screener.",
    category: "etf",
    source: "etf-issuer",
    namePattern: "spdr|state street",
    hrefBase: "/etf",
  },
  "invesco-etfs": {
    title: "Invesco ETFs",
    description: "The largest U.S. Invesco ETFs, ranked by market value from the FMP screener.",
    category: "etf",
    source: "etf-issuer",
    namePattern: "invesco",
    hrefBase: "/etf",
  },
  "schwab-etfs": {
    title: "Schwab ETFs",
    description: "The largest U.S. Charles Schwab ETFs, ranked by market value from the FMP screener.",
    category: "etf",
    source: "etf-issuer",
    namePattern: "schwab",
    hrefBase: "/etf",
  },
  "tsx-stocks": {
    title: "Toronto Stock Exchange",
    description: "The largest Canadian companies listed on the TSX.",
    category: "international",
    source: "screener",
    filters: { exchange: "TSX", country: "CA" },
    limit: 100,
    sort: "marketCap",
    listing: "raw",
    symbolPattern: "^[A-Z0-9]+\\.TO$",
  },
  "london-stocks": {
    title: "London Stock Exchange",
    description: "The largest U.K. companies listed on the London Stock Exchange.",
    category: "international",
    source: "screener",
    filters: { exchange: "LSE", country: "GB" },
    limit: 100,
    sort: "marketCap",
    listing: "raw",
    symbolPattern: "^[A-Z0-9]+\\.L$",
  },
  "hong-kong-stocks": {
    title: "Hong Kong Stock Exchange",
    description: "The largest companies listed on the Hong Kong Stock Exchange.",
    category: "international",
    source: "screener",
    filters: { exchange: "HKSE" },
    limit: 100,
    sort: "marketCap",
    listing: "raw",
    symbolPattern: "^\\d{4}\\.HK$",
  },
  "australia-stocks": {
    title: "Australian Securities Exchange",
    description: "The largest Australian companies listed on the ASX.",
    category: "international",
    source: "screener",
    filters: { exchange: "ASX", country: "AU" },
    limit: 100,
    sort: "marketCap",
    listing: "raw",
    symbolPattern: "^[A-Z0-9]{2,4}\\.AX$",
  },
  "germany-stocks": {
    title: "Deutsche Börse (Xetra)",
    description: "The largest German companies listed on Xetra.",
    category: "international",
    source: "screener",
    filters: { exchange: "XETRA", country: "DE" },
    limit: 100,
    sort: "marketCap",
    listing: "raw",
    symbolPattern: "^[A-Z0-9]+\\.DE$",
  },
} as const satisfies Record<string, StockList>;

export type StockListSlug = keyof typeof STOCK_LISTS;

export const LIST_CATEGORIES = [
  { id: "index", title: "In Index" },
  { id: "popular", title: "Popular Lists" },
  { id: "exchange", title: "U.S. Exchanges" },
  { id: "market-cap", title: "Market Cap Groups" },
  { id: "etf", title: "ETF Lists" },
  { id: "international", title: "International Exchanges" },
] as const;

export const LIST_NAV = [
  { href: "/list", label: "All Lists" },
  { href: "/list/sp-500-stocks", label: "S&P 500" },
  { href: "/list/nasdaq-100-stocks", label: "Nasdaq 100" },
  { href: "/list/dow-jones-stocks", label: "Dow Jones" },
  { href: "/list/biggest-companies", label: "Biggest" },
  { href: "/list/oldest-companies", label: "Oldest" },
  { href: "/list/foreign-stocks", label: "Foreign" },
  { href: "/list/highest-dividend", label: "Dividends" },
  { href: "/list/dividend-aristocrats", label: "Aristocrats" },
  { href: "/list/dividend-kings", label: "Kings" },
  { href: "/list/monthly-dividend-stocks", label: "Monthly Dividends" },
  { href: "/list/penny-stocks", label: "Penny Stocks" },
  { href: "/list/high-beta-stocks", label: "High Beta" },
  { href: "/list/magnificent-seven", label: "Mag 7" },
  { href: "/list/52-week-high", label: "52-Week High" },
  { href: "/list/highest-volume", label: "Volume" },
  { href: "/list/dividend-etfs", label: "Dividend ETFs" },
];

export function listHrefBase(slug: StockListSlug) {
  const list = STOCK_LISTS[slug];
  return "hrefBase" in list && list.hrefBase ? list.hrefBase : "/stocks";
}

export function isStockListSlug(value: string): value is StockListSlug {
  return value in STOCK_LISTS;
}

export async function loadStockList(slug: StockListSlug): Promise<SymbolTableRow[]> {
  const list = STOCK_LISTS[slug];

  if (list.source === "constituents") {
    const constituents = await getIndexConstituents(list.index);
    const quotes = await getQuotes(constituents.map((row) => row.symbol));
    const bySymbol = new Map(quotes.map((quote) => [quote.symbol, quote]));
    return constituents
      .map((row) => {
        const quote = bySymbol.get(row.symbol);
        return {
          symbol: row.symbol,
          name: row.name,
          industry: row.subSector || row.sector,
          marketCap: quote?.marketCap ?? null,
          price: quote?.price ?? null,
          changePercentage: quote?.changePercentage ?? null,
          volume: quote?.volume ?? null,
        };
      })
      .sort((a, b) => (b.marketCap ?? 0) - (a.marketCap ?? 0));
  }

  if (list.source === "monthly-dividends") {
    return loadMonthlyDividendStocks();
  }

  if (list.source === "symbols") {
    return loadSymbolsList(list.symbols);
  }

  if (list.source === "week-range") {
    return loadWeekRangeList(list.direction);
  }

  if (list.source === "etf-issuer") {
    return loadEtfIssuerList(list.namePattern);
  }

  if (list.source === "oldest") {
    return loadOldestSp500();
  }

  if (list.source === "otc") {
    return loadOtcStocks();
  }

  if (list.source === "foreign-us") {
    return loadForeignUsStocks();
  }

  const listing = "listing" in list && list.listing === "raw" ? "raw" : "primary";
  const yieldMax = "yieldMax" in list ? list.yieldMax : undefined;
  const symbolPattern =
    "symbolPattern" in list && typeof list.symbolPattern === "string" ? new RegExp(list.symbolPattern, "i") : null;
  const raw = await getScreener({ ...list.filters }, { limit: list.limit });
  let selected = listing === "raw" ? uniqueBySymbol(raw) : preferPrimaryListings(raw);
  if (symbolPattern) {
    selected = selected.filter((row) => symbolPattern.test(row.symbol));
  }
  let rows = await toScreenerRows(selected);
  const capMax =
    "capMax" in list && typeof list.capMax === "number"
      ? list.capMax
      : listing === "raw"
        ? 20_000_000_000_000
        : undefined;
  if (capMax != null) {
    rows = rows.filter((row) => (row.marketCap ?? 0) > 0 && (row.marketCap ?? 0) < capMax);
  }
  if (yieldMax != null) {
    rows = rows.filter((row) => (row.dividendYield ?? 0) > 0 && (row.dividendYield ?? 0) < yieldMax);
  }

  if (list.sort === "dividendYield") {
    return rows.sort((a, b) => (b.dividendYield ?? 0) - (a.dividendYield ?? 0)).slice(0, 50);
  }
  if (list.sort === "volume") {
    return rows.sort((a, b) => (b.volume ?? 0) - (a.volume ?? 0)).slice(0, 100);
  }
  return rows.sort((a, b) => (b.marketCap ?? 0) - (a.marketCap ?? 0)).slice(0, 100);
}

async function toScreenerRows(raw: FmpScreenerRow[]): Promise<SymbolTableRow[]> {
  const quotes = await getQuotes(raw.map((row) => row.symbol));
  const bySymbol = new Map(quotes.map((quote) => [quote.symbol, quote]));
  return raw.map((row) => {
    const quote = bySymbol.get(row.symbol);
    const price = quote?.price ?? row.price;
    const dividend = row.lastAnnualDividend;
    const dividendYield = price && dividend ? dividend / price : 0;
    return {
      symbol: row.symbol,
      name: row.companyName,
      marketCap: quote?.marketCap ?? row.marketCap,
      price,
      changePercentage: quote?.changePercentage,
      industry: row.industry,
      country: row.country,
      exchange: row.exchangeShortName || row.exchange,
      volume: quote?.volume ?? row.volume,
      dividendYield,
    };
  });
}

async function loadSymbolsList(symbols: readonly string[]): Promise<SymbolTableRow[]> {
  const [quotes, screener] = await Promise.all([
    getQuotes([...symbols]),
    getScreener({ country: "US" }, { limit: 1000 }),
  ]);
  const bySymbol = new Map(quotes.map((quote) => [quote.symbol, quote]));
  const meta = new Map(screener.map((row) => [row.symbol, row]));
  return symbols
    .map((symbol) => {
      const quote = bySymbol.get(symbol);
      const row = meta.get(symbol);
      const price = quote?.price ?? row?.price ?? null;
      const dividend = row?.lastAnnualDividend;
      return {
        symbol,
        name: quote?.name || row?.companyName || symbol,
        industry: row?.industry,
        marketCap: quote?.marketCap ?? row?.marketCap ?? null,
        price,
        changePercentage: quote?.changePercentage ?? null,
        volume: quote?.volume ?? row?.volume ?? null,
        dividendYield: price && dividend ? dividend / price : null,
        country: row?.country,
      };
    })
    .sort((a, b) => (b.marketCap ?? 0) - (a.marketCap ?? 0));
}

async function loadWeekRangeList(direction: "high" | "low"): Promise<SymbolTableRow[]> {
  const raw = await getScreener(
    { country: "US", marketCapMoreThan: 1_000_000_000, volumeMoreThan: 200_000 },
    { limit: 200 },
  );
  const selected = preferPrimaryListings(raw);
  const quotes = await getQuotes(selected.map((row) => row.symbol));
  const bySymbol = new Map(quotes.map((quote) => [quote.symbol, quote]));
  const scored = selected.flatMap((row) => {
    const quote = bySymbol.get(row.symbol);
    const price = quote?.price ?? row.price;
    const yearHigh = quote?.yearHigh;
    const yearLow = quote?.yearLow;
    if (!price || price <= 0) return [];
    const proximity =
      direction === "high"
        ? yearHigh && yearHigh > 0
          ? price / yearHigh
          : null
        : yearLow && yearLow > 0
          ? price / yearLow
          : null;
    if (proximity == null) return [];
    if (direction === "high" && proximity < 0.97) return [];
    if (direction === "low" && (price <= 1 || proximity > 1.08)) return [];
    const dividend = row.lastAnnualDividend;
    return [
      {
        proximity,
        row: {
          symbol: row.symbol,
          name: row.companyName,
          industry: row.industry,
          marketCap: quote?.marketCap ?? row.marketCap,
          price,
          changePercentage: quote?.changePercentage,
          volume: quote?.volume ?? row.volume,
          dividendYield: dividend ? dividend / price : null,
        } satisfies SymbolTableRow,
      },
    ];
  });
  scored.sort((a, b) => (direction === "high" ? b.proximity - a.proximity : a.proximity - b.proximity));
  return scored.slice(0, 100).map((item) => item.row);
}

async function loadEtfIssuerList(namePattern: string): Promise<SymbolTableRow[]> {
  const matcher = new RegExp(namePattern, "i");
  const raw = await getScreener({ isEtf: true, isFund: false, country: "US" }, { limit: 200 });
  const selected = preferPrimaryListings(raw).filter((row) => matcher.test(row.companyName || ""));
  const rows = await toScreenerRows(selected);
  return rows
    .filter((row) => (row.marketCap ?? 0) > 0)
    .sort((a, b) => (b.marketCap ?? 0) - (a.marketCap ?? 0))
    .slice(0, 50);
}

async function loadOldestSp500(): Promise<SymbolTableRow[]> {
  const constituents = await getIndexConstituents("sp500");
  const ranked = constituents
    .map((row) => ({ ...row, foundedYear: parseFoundedYear(row.founded) }))
    .filter((row): row is typeof row & { foundedYear: number } => row.foundedYear != null)
    .sort((a, b) => a.foundedYear - b.foundedYear || a.symbol.localeCompare(b.symbol))
    .slice(0, 100);
  const quotes = await getQuotes(ranked.map((row) => row.symbol));
  const bySymbol = new Map(quotes.map((quote) => [quote.symbol, quote]));
  return ranked.map((row) => {
    const quote = bySymbol.get(row.symbol);
    return {
      symbol: row.symbol,
      name: row.name,
      industry: row.subSector || row.sector,
      founded: row.foundedYear,
      marketCap: quote?.marketCap ?? null,
      price: quote?.price ?? null,
      changePercentage: quote?.changePercentage ?? null,
      volume: quote?.volume ?? null,
    };
  });
}

async function loadOtcStocks(): Promise<SymbolTableRow[]> {
  const raw = await getScreener({ exchange: "OTC", country: "US" }, { limit: 200 });
  const cleaned = uniqueBySymbol(
    raw.filter((row) => {
      if (isForeignListingSymbol(row.symbol)) return false;
      const cap = row.marketCap ?? 0;
      return cap > 0 && cap < 200_000_000_000;
    }),
  );
  const rows = await toScreenerRows(cleaned);
  return rows.sort((a, b) => (b.marketCap ?? 0) - (a.marketCap ?? 0)).slice(0, 100);
}

async function loadForeignUsStocks(): Promise<SymbolTableRow[]> {
  const batches = await Promise.all([
    getScreener({ exchange: "NYSE" }, { limit: 100 }),
    getScreener({ exchange: "NASDAQ" }, { limit: 100 }),
    getScreener({ exchange: "AMEX" }, { limit: 100 }),
  ]);
  const foreign = uniqueBySymbol(
    batches.flat().filter((row) => {
      if (!row.country || row.country.toUpperCase() === "US") return false;
      if (isForeignListingSymbol(row.symbol)) return false;
      return (row.marketCap ?? 0) > 0;
    }),
  );
  const rows = await toScreenerRows(foreign);
  return rows.sort((a, b) => (b.marketCap ?? 0) - (a.marketCap ?? 0)).slice(0, 100);
}

async function loadMonthlyDividendStocks(): Promise<SymbolTableRow[]> {
  const today = nyDateString();
  const from = isoDate(addDays(new Date(`${today}T00:00:00Z`), -7));
  const to = isoDate(addDays(new Date(`${today}T00:00:00Z`), 45));
  const calendar = await getDividendCalendar(from, to);
  const monthly = uniqueBySymbol(
    calendar.filter((row) => /month/i.test(row.frequency || "") && !isForeignListingSymbol(row.symbol)),
  );
  const quotes = await getQuotes(monthly.map((row) => row.symbol));
  const bySymbol = new Map(quotes.map((quote) => [quote.symbol, quote]));
  return monthly
    .map((row) => {
      const quote = bySymbol.get(row.symbol);
      const price = quote?.price ?? null;
      const payments = annualDividendPayments(row.frequency);
      const dividendYield = price && row.dividend ? (row.dividend * payments) / price : null;
      return {
        symbol: row.symbol,
        name: quote?.name || row.symbol,
        marketCap: quote?.marketCap ?? null,
        price,
        changePercentage: quote?.changePercentage ?? null,
        volume: quote?.volume ?? null,
        dividendYield,
      };
    })
    .filter((row) => row.price && row.price > 0 && (row.dividendYield ?? 0) > 0 && (row.dividendYield ?? 0) < 0.4)
    .sort((a, b) => (b.dividendYield ?? 0) - (a.dividendYield ?? 0))
    .slice(0, 100);
}
