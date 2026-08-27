import { getIndexConstituents, getQuotes, getScreener } from "@/lib/fmp";
import { preferPrimaryListings } from "@/lib/listings";
import type { SymbolTableRow } from "@/components/symbol-table";

type ScreenerList = {
  title: string;
  description: string;
  category: "popular" | "index" | "exchange" | "market-cap";
  source: "screener";
  filters: Record<string, string | number | boolean>;
  limit: number;
  sort?: "marketCap" | "dividendYield";
};

type ConstituentList = {
  title: string;
  description: string;
  category: "popular" | "index" | "exchange" | "market-cap";
  source: "constituents";
  index: "sp500" | "nasdaq" | "dow";
};

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
  "highest-dividend": {
    title: "Highest Dividend Stocks",
    description: "U.S. stocks with the highest indicated dividend yield.",
    category: "popular",
    source: "screener",
    filters: { country: "US", dividendMoreThan: 0.2 },
    limit: 100,
    sort: "dividendYield",
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
} as const satisfies Record<string, ScreenerList | ConstituentList>;

export type StockListSlug = keyof typeof STOCK_LISTS;

export const LIST_CATEGORIES = [
  { id: "index", title: "In Index" },
  { id: "popular", title: "Popular Lists" },
  { id: "exchange", title: "U.S. Exchanges" },
  { id: "market-cap", title: "Market Cap Groups" },
] as const;

export const LIST_NAV = [
  { href: "/list", label: "All Lists" },
  { href: "/list/sp-500-stocks", label: "S&P 500" },
  { href: "/list/nasdaq-100-stocks", label: "Nasdaq 100" },
  { href: "/list/dow-jones-stocks", label: "Dow Jones" },
  { href: "/list/biggest-companies", label: "Biggest" },
  { href: "/list/highest-dividend", label: "Dividends" },
];

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

  const raw = await getScreener({ ...list.filters }, { limit: list.limit });
  const primary = preferPrimaryListings(raw);
  const quotes = await getQuotes(primary.map((row) => row.symbol));
  const bySymbol = new Map(quotes.map((quote) => [quote.symbol, quote]));
  const rows = primary.map((row) => {
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
      volume: quote?.volume ?? row.volume,
      dividendYield,
    };
  });

  if (list.sort === "dividendYield") {
    return rows.sort((a, b) => (b.dividendYield ?? 0) - (a.dividendYield ?? 0)).slice(0, 50);
  }
  return rows.sort((a, b) => (b.marketCap ?? 0) - (a.marketCap ?? 0)).slice(0, 100);
}
