import { NextRequest } from "next/server";
import { getQuoteSafe, getQuotes } from "@/lib/fmp";
import { decodeTicker } from "@/lib/listings";

export async function GET(request: NextRequest) {
  const symbols = (request.nextUrl.searchParams.get("symbols") ?? "")
    .split(",")
    .map((symbol) => decodeTicker(symbol.trim()))
    .filter(Boolean);
  const unique = [...new Set(symbols)];
  const quotes = await getQuotes(unique);
  const bySymbol = new Map(quotes.map((quote) => [quote.symbol.toUpperCase(), quote]));
  const missing = unique.filter((symbol) => !bySymbol.has(symbol.toUpperCase()));
  if (missing.length > 0) {
    const extras = await Promise.all(missing.map((symbol) => getQuoteSafe(symbol)));
    for (const quote of extras) {
      if (quote?.symbol) bySymbol.set(quote.symbol.toUpperCase(), quote);
    }
  }
  const ordered = unique
    .map((symbol) => bySymbol.get(symbol.toUpperCase()))
    .filter((quote): quote is NonNullable<typeof quote> => Boolean(quote));
  return Response.json(ordered);
}
