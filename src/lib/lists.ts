export const STOCK_LISTS = {
  "biggest-companies": {
    title: "Biggest Companies",
    description: "The largest U.S. companies ranked by market capitalization.",
    filters: { country: "US" as const },
    limit: 100,
  },
  "nasdaq-stocks": {
    title: "NASDAQ Stocks",
    description: "The largest companies listed on the NASDAQ.",
    filters: { country: "US" as const, exchange: "NASDAQ" },
    limit: 100,
  },
  "nyse-stocks": {
    title: "NYSE Stocks",
    description: "The largest companies listed on the New York Stock Exchange.",
    filters: { country: "US" as const, exchange: "NYSE" },
    limit: 100,
  },
} as const;

export type StockListSlug = keyof typeof STOCK_LISTS;

export function isStockListSlug(value: string): value is StockListSlug {
  return value in STOCK_LISTS;
}
