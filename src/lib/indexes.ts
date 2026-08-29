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

export const INDEX_SYMBOLS = [
  { symbol: "^GSPC", label: "S&P 500" },
  { symbol: "^DJI", label: "Dow Jones" },
  { symbol: "^IXIC", label: "Nasdaq" },
  { symbol: "^RUT", label: "Russell 2000" },
  { symbol: "^VIX", label: "VIX" },
] as const;

/** National benchmarks FMP quotes. First eight stay on the markets hub snippet. */
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
  { symbol: "^IBEX", label: "IBEX 35", region: "Spain" },
  { symbol: "^AEX", label: "AEX", region: "Netherlands" },
  { symbol: "^OMXS30", label: "OMX Stockholm 30", region: "Sweden" },
  { symbol: "^OMXC20", label: "OMX Copenhagen 20", region: "Denmark" },
  { symbol: "^OSEAX", label: "Oslo All-Share", region: "Norway" },
  { symbol: "^ATX", label: "ATX", region: "Austria" },
  { symbol: "^BFX", label: "BEL 20", region: "Belgium" },
  { symbol: "^OMXH25", label: "OMX Helsinki 25", region: "Finland" },
  { symbol: "FTSEMIB.MI", label: "FTSE MIB", region: "Italy" },
  { symbol: "^STOXX", label: "STOXX Europe 600", region: "Europe" },
  { symbol: "^N100", label: "Euronext 100", region: "Europe" },
  { symbol: "^NZ50", label: "S&P/NZX 50", region: "New Zealand" },
  { symbol: "^MERV", label: "S&P Merval", region: "Argentina" },
  { symbol: "^TA125.TA", label: "TA-125", region: "Israel" },
  { symbol: "^TASI.SR", label: "Tadawul All Share", region: "Saudi Arabia" },
  { symbol: "^SET.BK", label: "SET", region: "Thailand" },
  { symbol: "^KLSE", label: "FTSE KLCI", region: "Malaysia" },
  { symbol: "^NSEI", label: "Nifty 50", region: "India" },
  { symbol: "000001.SS", label: "SSE Composite", region: "China" },
  { symbol: "^HSCE", label: "Hang Seng China Enterprises", region: "Hong Kong" },
  { symbol: "IMOEX.ME", label: "MOEX Russia", region: "Russia" },
  { symbol: "WIG20.WA", label: "WIG20", region: "Poland" },
  { symbol: "XU100.IS", label: "BIST 100", region: "Turkey" },
  { symbol: "^CASE30", label: "EGX 30", region: "Egypt" },
] as const;

const NON_CARET_INDEX_TICKERS = new Set<string>(
  [...INDEX_SYMBOLS, ...WORLD_INDEX_SYMBOLS]
    .map((item) => item.symbol)
    .filter((symbol) => !symbol.startsWith("^")),
);

export function isIndexTicker(symbol: string) {
  const ticker = decodeTicker(symbol);
  return ticker.startsWith("^") || NON_CARET_INDEX_TICKERS.has(ticker);
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
  const listed =
    WORLD_INDEX_SYMBOLS.find((item) => item.symbol === ticker)?.label ??
    INDEX_SYMBOLS.find((item) => item.symbol === ticker)?.label;
  return INDEX_LABELS[ticker] ?? listed ?? fallback ?? ticker;
}
