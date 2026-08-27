import {
  getCashFlowTtm,
  getEstimates,
  getGradesConsensus,
  getIncomeTtm,
  getKeyMetricsTtm,
  getPriceChange,
  getPriceTarget,
  getProfile,
  getQuote,
  getRatiosTtm,
} from "@/lib/fmp";

export const POPULAR_STOCK_COMPARISONS = [
  ["AAPL", "MSFT"],
  ["AAPL", "GOOGL"],
  ["NVDA", "AMD"],
  ["AMZN", "WMT"],
  ["META", "GOOGL"],
  ["JPM", "BAC"],
  ["V", "MA"],
  ["KO", "PEP"],
  ["XOM", "CVX"],
  ["TSLA", "F"],
  ["UNH", "JNJ"],
  ["COST", "WMT"],
] as const;

export async function getProfilesAndQuotes(symbols: string[]) {
  return Promise.all(
    symbols.map(async (symbol) => {
      const [quote, profile, ttm, ratios, cash, metrics, changes, estimates, target, grades] = await Promise.all([
        getQuote(symbol),
        getProfile(symbol),
        getIncomeTtm(symbol),
        getRatiosTtm(symbol),
        getCashFlowTtm(symbol),
        getKeyMetricsTtm(symbol),
        getPriceChange(symbol),
        getEstimates(symbol, "annual"),
        getPriceTarget(symbol),
        getGradesConsensus(symbol),
      ]);
      return { symbol, quote, profile, ttm, ratios, cash, metrics, changes, estimates, target, grades };
    }),
  );
}
