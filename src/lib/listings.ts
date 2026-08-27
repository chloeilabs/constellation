const US_SHARE_CLASSES = new Set(["A", "B", "C", "D", "K", "P", "U", "V", "W", "Y"]);
const US_EXCHANGE = /NASDAQ|NYSE|AMEX|NYSEARCA|BATS/;
const FOREIGN_EXCHANGE = /FRANKFURT|XETRA|LONDON|TSX|NEO|MEXICO|BUENOS|HONG|TOKYO|EURONEXT|BERLIN|MILAN|SAO PAULO|SANTIAGO/;

/** Dual listings use suffixes like AAPL.MX / MSF.F. US share classes use A/B/C (BRK.B). */
export function isForeignListingSymbol(symbol: string) {
  const dot = symbol.lastIndexOf(".");
  if (dot <= 0) return false;
  const suffix = symbol.slice(dot + 1).toUpperCase();
  if (suffix.length > 1) return true;
  return !US_SHARE_CLASSES.has(suffix);
}

export function preferPrimaryListings<T extends { symbol: string; marketCap?: number | null; exchange?: string; exchangeShortName?: string }>(
  rows: T[],
) {
  const primary = rows.filter((row) => {
    if (isForeignListingSymbol(row.symbol)) return false;
    const exchange = `${row.exchangeShortName ?? ""} ${row.exchange ?? ""}`.toUpperCase();
    if (FOREIGN_EXCHANGE.test(exchange)) return false;
    if (exchange.trim() && !US_EXCHANGE.test(exchange) && !/CBOE/.test(exchange)) return false;
    return true;
  });
  return (primary.length ? primary : rows).sort((a, b) => (b.marketCap ?? 0) - (a.marketCap ?? 0));
}
