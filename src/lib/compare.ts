import { getIncomeTtm, getProfile, getQuote, getRatiosTtm } from "@/lib/fmp";

export async function getProfilesAndQuotes(symbols: string[]) {
  return Promise.all(
    symbols.map(async (symbol) => {
      const [quote, profile, ttm, ratios] = await Promise.all([
        getQuote(symbol),
        getProfile(symbol),
        getIncomeTtm(symbol),
        getRatiosTtm(symbol),
      ]);
      return { symbol, quote, profile, ttm, ratios };
    }),
  );
}
