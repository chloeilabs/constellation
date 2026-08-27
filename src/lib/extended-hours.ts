import {
  getBatchAftermarketQuotes,
  getBatchAftermarketTrades,
  getGainers,
  getLosers,
  getMostActive,
  getQuotes,
  POPULAR_SYMBOLS,
} from "@/lib/fmp";
import { isForeignListingSymbol } from "@/lib/listings";

export type ExtendedHoursRow = {
  symbol: string;
  name: string;
  last: number | null;
  extended: number | null;
  change: number | null;
  changePct: number | null;
  volume: number | null;
  bid: number | null;
  ask: number | null;
};

export async function getExtendedHoursRows(): Promise<ExtendedHoursRow[]> {
  const [gainers, losers, active] = await Promise.all([getGainers(), getLosers(), getMostActive()]);
  const symbols = [
    ...new Set(
      [...gainers, ...losers, ...active, ...POPULAR_SYMBOLS.map((symbol) => ({ symbol }))]
        .map((row) => row.symbol.toUpperCase())
        .filter((symbol) => symbol && !isForeignListingSymbol(symbol)),
    ),
  ].slice(0, 80);

  const [quotes, trades, books] = await Promise.all([
    getQuotes(symbols),
    getBatchAftermarketTrades(symbols),
    getBatchAftermarketQuotes(symbols),
  ]);
  const quoteBy = new Map(quotes.map((row) => [row.symbol, row]));
  const tradeBy = new Map(trades.map((row) => [row.symbol, row]));
  const bookBy = new Map(books.map((row) => [row.symbol, row]));
  const nameBy = new Map(
    [...gainers, ...losers, ...active].map((row) => [row.symbol.toUpperCase(), row.name]),
  );

  return symbols
    .map((symbol) => {
      const quote = quoteBy.get(symbol);
      const trade = tradeBy.get(symbol);
      const book = bookBy.get(symbol);
      const last = quote?.price ?? null;
      const extended = trade?.price || book?.bidPrice || book?.askPrice || null;
      const change = extended != null && last != null ? extended - last : null;
      const changePct = change != null && last ? (change / last) * 100 : null;
      return {
        symbol,
        name: quote?.name || nameBy.get(symbol) || symbol,
        last,
        extended,
        change,
        changePct,
        volume: book?.volume ?? quote?.volume ?? null,
        bid: book?.bidPrice ?? null,
        ask: book?.askPrice ?? null,
      };
    })
    .filter((row) => row.extended != null);
}
