import { decodeTicker } from "@/lib/listings";
import { INDEX_LABELS } from "@/lib/statements";

export const US_INDEX_CONSTITUENTS = {
  "^GSPC": {
    fmpIndex: "sp500" as const,
    listSlug: "sp-500-stocks",
    label: "S&P 500",
  },
  "^DJI": {
    fmpIndex: "dow" as const,
    listSlug: "dow-jones-stocks",
    label: "Dow Jones Industrial Average",
  },
  "^NDX": {
    fmpIndex: "nasdaq" as const,
    listSlug: "nasdaq-100-stocks",
    label: "Nasdaq 100",
  },
} as const;

export type UsIndexTicker = keyof typeof US_INDEX_CONSTITUENTS;
export type FmpIndexKey = (typeof US_INDEX_CONSTITUENTS)[UsIndexTicker]["fmpIndex"];

export function isIndexTicker(symbol: string) {
  return decodeTicker(symbol).startsWith("^");
}

export function indexConstituentMeta(symbol: string) {
  const ticker = decodeTicker(symbol);
  if (ticker in US_INDEX_CONSTITUENTS) {
    return US_INDEX_CONSTITUENTS[ticker as UsIndexTicker];
  }
  return null;
}

export function indexDisplayName(symbol: string, fallback?: string | null) {
  const ticker = decodeTicker(symbol);
  return INDEX_LABELS[ticker] ?? fallback ?? ticker;
}
