import { getDividends, getEtfHoldings, getEtfInfo, getPriceChange, getProfile, getQuote } from "@/lib/fmp";
import { decodeTicker } from "@/lib/listings";

export const POPULAR_ETF_COMPARISONS = [
  ["QQQ", "SPY"],
  ["VOO", "VTI"],
  ["SPY", "VOO"],
  ["QQQ", "QQQM"],
  ["IVV", "VOO"],
  ["QQQ", "VGT"],
  ["JEPI", "JEPQ"],
  ["VTI", "VXUS"],
  ["IWM", "SPY"],
  ["GLD", "IAU"],
  ["VTSAX", "VFIAX"],
  ["FXAIX", "VFIAX"],
] as const;

export async function loadEtfCompare(symbols: string[]) {
  const unique = [...new Set(symbols.map((symbol) => decodeTicker(symbol)).filter(Boolean))].slice(0, 4);
  return Promise.all(
    unique.map(async (symbol) => {
      const [quote, info, profile, changes, dividends, holdings] = await Promise.all([
        getQuote(symbol),
        getEtfInfo(symbol),
        getProfile(symbol),
        getPriceChange(symbol),
        getDividends(symbol, 4),
        getEtfHoldings(symbol),
      ]);
      const ttmDividend = dividends.slice(0, 4).reduce((sum, row) => sum + (row.dividend || 0), 0);
      const top = [...holdings].sort((a, b) => (b.weightPercentage ?? 0) - (a.weightPercentage ?? 0)).slice(0, 10);
      return {
        symbol,
        quote,
        info,
        profile,
        changes,
        latestDividend: dividends[0] ?? null,
        ttmDividend,
        holdingsCount: info?.holdingsCount ?? holdings.length,
        topHoldings: top,
      };
    }),
  );
}

export function overlappingHoldings(rows: Awaited<ReturnType<typeof loadEtfCompare>>) {
  if (rows.length < 2) return [];
  const maps = rows.map(
    (row) => new Map(row.topHoldings.map((holding) => [holding.asset.toUpperCase(), holding])),
  );
  const first = [...maps[0].keys()];
  return first
    .filter((asset) => maps.every((map) => map.has(asset)))
    .map((asset) => ({
      asset,
      name: maps[0].get(asset)?.name ?? asset,
      weights: maps.map((map) => map.get(asset)?.weightPercentage ?? null),
    }));
}
