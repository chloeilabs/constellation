import { getProfile, getQuote } from "@/lib/fmp";

export async function getProfilesAndQuotes(symbols: string[]) {
  return Promise.all(
    symbols.map(async (symbol) => {
      const [quote, profile] = await Promise.all([getQuote(symbol), getProfile(symbol)]);
      return { symbol, quote, profile };
    }),
  );
}
