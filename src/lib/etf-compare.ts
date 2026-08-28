import { DISTRIBUTION_TTM_LIMIT, trailingDividendWindow } from "@/lib/dividends";
import { getDividends, getEtfCountryWeights, getEtfHoldings, getEtfInfo, getEtfSectors, getPriceChange, getProfile, getQuote } from "@/lib/fmp";
import { decodeTicker } from "@/lib/listings";
import { nyDateString, parseWeightPercentage } from "@/lib/utils";

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
      const [quote, info, profile, changes, dividends, holdings, sectors, countries] = await Promise.all([
        getQuote(symbol),
        getEtfInfo(symbol),
        getProfile(symbol),
        getPriceChange(symbol),
        getDividends(symbol, DISTRIBUTION_TTM_LIMIT),
        getEtfHoldings(symbol),
        getEtfSectors(symbol),
        getEtfCountryWeights(symbol),
      ]);
      const ttmDividend = trailingDividendWindow(dividends, nyDateString());
      const top = [...holdings].sort((a, b) => (b.weightPercentage ?? 0) - (a.weightPercentage ?? 0)).slice(0, 10);
      const rankedSectors = [...sectors]
        .map((row) => ({ name: row.sector, weight: row.weightPercentage ?? 0 }))
        .filter((row) => row.name && row.weight > 0)
        .sort((a, b) => b.weight - a.weight);
      const rankedCountries = [...countries]
        .map((row) => ({ name: row.country, weight: parseWeightPercentage(row.weightPercentage) }))
        .filter((row) => row.name && row.weight > 0)
        .sort((a, b) => b.weight - a.weight);
      return {
        symbol,
        quote,
        info,
        profile,
        changes,
        latestDividend: dividends[0] ?? null,
        ttmDividend,
        holdingsCount: holdings.length || info?.holdingsCount,
        topHoldings: top,
        sectors: rankedSectors,
        countries: rankedCountries,
      };
    }),
  );
}

export type EtfCompareRow = Awaited<ReturnType<typeof loadEtfCompare>>[number];

export function overlappingHoldings(rows: EtfCompareRow[]) {
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

export function allocationRows(rows: EtfCompareRow[], kind: "sectors" | "countries", limit = 15) {
  const names = new Set<string>();
  for (const row of rows) {
    for (const item of row[kind]) names.add(item.name);
  }
  return [...names]
    .map((name) => ({
      name,
      weights: rows.map((row) => row[kind].find((item) => item.name === name)?.weight ?? null),
    }))
    .sort((a, b) => Math.max(...b.weights.map((weight) => weight ?? 0)) - Math.max(...a.weights.map((weight) => weight ?? 0)))
    .slice(0, limit);
}
