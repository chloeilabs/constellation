import { getCashFlowTtm, getIncomeTtm, getKeyMetricsTtm, getProfile, getQuote, getRatiosTtm } from "@/lib/fmp";

export async function getProfilesAndQuotes(symbols: string[]) {
  return Promise.all(
    symbols.map(async (symbol) => {
      const [quote, profile, ttm, ratios, cash, metrics] = await Promise.all([
        getQuote(symbol),
        getProfile(symbol),
        getIncomeTtm(symbol),
        getRatiosTtm(symbol),
        getCashFlowTtm(symbol),
        getKeyMetricsTtm(symbol),
      ]);
      return { symbol, quote, profile, ttm, ratios, cash, metrics };
    }),
  );
}
