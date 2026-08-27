const US_SHARE_CLASSES = new Set(["A", "B", "C", "D", "K", "P", "U", "V", "W", "Y"]);
const US_EXCHANGE = /NASDAQ|NYSE|AMEX|NYSEARCA|BATS/;
const US_VENUE = /NASDAQ|NYSE|AMEX|NYSEARCA|BATS|CBOE|OTC|PNK|OTCQX|OTCQB|NMS|NGM|NCM/;
const FOREIGN_EXCHANGE = /FRANKFURT|XETRA|LONDON|TSX|NEO|MEXICO|BUENOS|HONG|TOKYO|EURONEXT|BERLIN|MILAN|SAO PAULO|SANTIAGO/;
const ETF_NAME = /\bETF\b|\bETN\b|\bUCITS\b|TRUST,\s*SERIES|\bSPDR\b|\bISHARES\b/i;
export const FUND_NAME =
  /\bMutual Fund\b|\bIndex Fund\b|\bBond Fund\b|\bEquity Fund\b|\bIncome Fund\b|\bTarget[- ]Date\b/i;
const WELL_KNOWN_FUNDS = new Set([
  "FXAIX",
  "VFIAX",
  "VTSAX",
  "VTIAX",
  "VBTLX",
  "VIMAX",
  "VSMAX",
  "VWENX",
  "VWELX",
  "SWPPX",
  "SWTSX",
  "FSKAX",
  "FZROX",
  "FNILX",
  "FZILX",
  "FXNAX",
  "SPAXX",
  "FDRXX",
  "AGTHX",
  "DODGX",
  "TRBCX",
  "PRGFX",
  "VGSLX",
  "VGTSX",
  "VTSMX",
  "VFINX",
]);
const WELL_KNOWN_ETFS = new Set([
  "SPY",
  "QQQ",
  "QQQM",
  "IWM",
  "DIA",
  "VOO",
  "VTI",
  "IVV",
  "VEA",
  "VWO",
  "EFA",
  "EEM",
  "GLD",
  "SLV",
  "TLT",
  "IEF",
  "SHY",
  "LQD",
  "HYG",
  "JNK",
  "BND",
  "BNDX",
  "SGOV",
  "BIL",
  "XLF",
  "XLE",
  "XLK",
  "XLV",
  "XLI",
  "XLY",
  "XLP",
  "XLU",
  "XLB",
  "XLRE",
  "XLC",
  "SMH",
  "SOXX",
  "VIG",
  "VYM",
  "SCHD",
  "JEPI",
  "JEPQ",
  "QQQI",
  "TQQQ",
  "SQQQ",
  "SOXL",
  "SOXS",
  "SPXL",
  "UPRO",
  "TNA",
  "UVXY",
  "SVXY",
  "VXX",
  "ARKK",
  "ARKW",
  "ARKG",
  "ARKF",
  "IBIT",
  "FBTC",
  "GBTC",
  "BITO",
  "ETHA",
  "ETHE",
  "UNG",
  "USO",
  "GDX",
  "GDXJ",
  "XOP",
  "KRE",
  "XBI",
  "IBB",
  "RSP",
  "QUAL",
  "USMV",
  "MTUM",
  "IWF",
  "IWD",
  "IWB",
  "IJH",
  "IJR",
  "ACWI",
  "VT",
]);

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

export function looksLikeFund(name?: string | null) {
  return FUND_NAME.test(name ?? "");
}

export function decodeTicker(symbol: string) {
  try {
    return decodeURIComponent(symbol).toUpperCase();
  } catch {
    return symbol.toUpperCase();
  }
}

function safeDecodePath(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export function stockPath(symbol: string, suffix = "") {
  return `/stocks/${encodeURIComponent(decodeTicker(symbol))}${suffix}`;
}

export function samePath(pathname: string, href: string) {
  const left = safeDecodePath(pathname).replace(/\/$/, "") || "/";
  const right = safeDecodePath(href).replace(/\/$/, "") || "/";
  return left === right;
}

export function pathPrefix(pathname: string, href: string) {
  const left = safeDecodePath(pathname);
  const right = safeDecodePath(href);
  return left === right || left.startsWith(`${right}/`);
}

export function quoteHref(
  symbol: string,
  hint?: {
    name?: string | null;
    exchange?: string | null;
    exchangeFullName?: string | null;
    isEtf?: boolean | null;
    isFund?: boolean | null;
  },
) {
  const ticker = decodeTicker(symbol);
  if (hint?.isEtf || WELL_KNOWN_ETFS.has(ticker)) return `/etf/${ticker}`;
  const hay = `${hint?.name ?? ""} ${hint?.exchange ?? ""} ${hint?.exchangeFullName ?? ""}`;
  if (ETF_NAME.test(hay) || /ARCA/.test(hay.toUpperCase())) return `/etf/${ticker}`;
  if (hint?.isFund || WELL_KNOWN_FUNDS.has(ticker) || looksLikeFund(hint?.name)) return `/funds/${ticker}`;
  return stockPath(ticker);
}

export function quoteKind(
  symbol: string,
  hint?: {
    name?: string | null;
    exchange?: string | null;
    exchangeFullName?: string | null;
    isEtf?: boolean | null;
    isFund?: boolean | null;
  },
) {
  const href = quoteHref(symbol, hint);
  if (href.startsWith("/etf/")) return "ETF";
  if (href.startsWith("/funds/")) return "Fund";
  return "Stock";
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

export function usEtfHolders<T extends { symbol: string; sharesNumber: number; marketValue: number; weightPercentage: number }>(
  rows: T[],
) {
  return rows.filter((row) => {
    if (!row.symbol || isForeignListingSymbol(row.symbol)) return false;
    if (!(row.sharesNumber > 0) || !(row.marketValue > 0)) return false;
    if (!(row.weightPercentage > 0) || row.weightPercentage > 250) return false;
    return true;
  });
}
