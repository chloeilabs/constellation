const US_SHARE_CLASSES = new Set(["A", "B", "C", "D", "K", "P", "U", "V", "W", "Y"]);
const US_EXCHANGE = /NASDAQ|NYSE|AMEX|NYSEARCA|BATS/;
const US_VENUE = /NASDAQ|NYSE|AMEX|NYSEARCA|BATS|CBOE|OTC|PNK|OTCQX|OTCQB|NMS|NGM|NCM/;
const FOREIGN_EXCHANGE = /FRANKFURT|XETRA|LONDON|TSX|NEO|MEXICO|BUENOS|HONG|TOKYO|EURONEXT|BERLIN|MILAN|SAO PAULO|SANTIAGO/;

/** Dual listings use suffixes like AAPL.MX / MSF.F. US share classes use A/B/C (BRK.B). */
export function isForeignListingSymbol(symbol: string) {
  const dot = symbol.lastIndexOf(".");
  if (dot <= 0) return false;
  const suffix = symbol.slice(dot + 1).toUpperCase();
  if (suffix.length > 1) return true;
  return !US_SHARE_CLASSES.has(suffix);
}

export function isUsVenue(exchange?: string | null) {
  return Boolean(exchange && US_VENUE.test(exchange.toUpperCase()));
}

/** First four-digit year in FMP `founded` values such as `1806`, `1975/1977`, or `2005-06-23`. */
export function parseFoundedYear(value: string | null | undefined) {
  if (!value) return null;
  const match = String(value).match(/(1[6-9]\d{2}|20\d{2})/);
  if (!match) return null;
  const year = Number(match[1]);
  const max = new Date().getFullYear() + 1;
  if (year < 1600 || year > max) return null;
  return year;
}

export function quoteHref(
  symbol: string,
  hint?: { name?: string | null; exchange?: string | null; exchangeFullName?: string | null; isEtf?: boolean | null },
) {
  const ticker = symbol.toUpperCase();
  if (hint?.isEtf) return `/etf/${ticker}`;
  const hay = `${hint?.name ?? ""} ${hint?.exchange ?? ""} ${hint?.exchangeFullName ?? ""}`.toUpperCase();
  if (/\bETF\b|\bETN\b/.test(hay) || /ARCA/.test(hay)) return `/etf/${ticker}`;
  return `/stocks/${ticker}`;
}

export function holdingQuoteHref(asset?: string | null, name?: string | null) {
  const ticker = asset?.trim();
  if (!ticker || ticker === "-") return null;
  if (/^(CASH|USD|EUR|GBP|JPY|CHF)$/i.test(ticker)) return null;
  if (name && /cash equivalent|money market|sweep/i.test(name)) return null;
  return quoteHref(ticker, { name });
}

export function uniqueBySymbol<T extends { symbol: string }>(rows: T[]) {
  const seen = new Set<string>();
  const unique: T[] = [];
  for (const row of rows) {
    const key = row.symbol.toUpperCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    unique.push(row);
  }
  return unique;
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
  return uniqueBySymbol(primary.length ? primary : rows).sort((a, b) => (b.marketCap ?? 0) - (a.marketCap ?? 0));
}
