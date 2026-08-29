const integerFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 0,
});

export function formatPrice(value: number | null | undefined, digits = 2) {
  if (value == null || Number.isNaN(value)) return "—";
  const abs = Math.abs(value);
  const fractionDigits = abs >= 1000 ? 2 : abs >= 1 ? digits : abs >= 0.01 ? 4 : 6;
  return value.toLocaleString("en-US", {
    minimumFractionDigits: Math.min(2, fractionDigits),
    maximumFractionDigits: fractionDigits,
  });
}

export function formatUsd(value: number | null | undefined, digits = 2) {
  if (value == null || Number.isNaN(value)) return "—";
  return `$${formatPrice(value, digits)}`;
}

const CURRENCY_PREFIX: Record<string, string> = {
  USD: "$",
  EUR: "€",
  GBP: "£",
  JPY: "¥",
  CNY: "¥",
  HKD: "HK$",
  CAD: "C$",
  AUD: "A$",
  INR: "₹",
  BRL: "R$",
  KRW: "₩",
  TWD: "NT$",
  SGD: "S$",
  CHF: "CHF ",
  MXN: "MX$",
  NZD: "NZ$",
  ILS: "₪",
  ZAR: "R",
  PLN: "zł",
  SEK: "kr",
  DKK: "kr",
  NOK: "kr",
  TRY: "₺",
  ARS: "AR$",
  CLP: "CLP ",
  IDR: "Rp",
  MYR: "RM",
  THB: "฿",
  SAR: "SAR ",
  AED: "AED ",
  QAR: "QR ",
  CZK: "Kč",
  ISK: "kr",
  RUB: "₽",
};

export function formatMoney(value: number | null | undefined, currency?: string | null, digits = 2) {
  if (value == null || Number.isNaN(value)) return "—";
  const code = (currency || "USD").toUpperCase();
  const prefix = CURRENCY_PREFIX[code];
  const amount =
    code === "JPY" || code === "KRW"
      ? value.toLocaleString("en-US", { maximumFractionDigits: 0 })
      : formatPrice(value, digits);
  return prefix ? `${prefix}${amount}` : `${amount} ${code}`;
}

/** Whole-dollar amounts such as revenue per employee on Stock Analysis. */
export function formatMoneyWhole(value: number | null | undefined, currency?: string | null) {
  if (value == null || Number.isNaN(value)) return "—";
  const code = (currency || "USD").toUpperCase();
  const prefix = CURRENCY_PREFIX[code];
  const amount = Math.round(value).toLocaleString("en-US", { maximumFractionDigits: 0 });
  return prefix ? `${prefix}${amount}` : `${amount} ${code}`;
}

export function formatCompact(value: number | null | undefined) {
  if (value == null || Number.isNaN(value)) return "—";
  const abs = Math.abs(value);
  if (abs >= 1e12) return `${(value / 1e12).toFixed(2)}T`;
  if (abs >= 1e9) return `${(value / 1e9).toFixed(2)}B`;
  if (abs >= 1e6) return `${(value / 1e6).toFixed(2)}M`;
  if (abs >= 1e3) return `${(value / 1e3).toFixed(2)}K`;
  return formatPrice(value);
}

export function formatCompactUsd(value: number | null | undefined, currency?: string | null) {
  return formatCompactMoney(value, currency);
}

const COUNTRY_CURRENCY: Record<string, string> = {
  US: "USD",
  CA: "CAD",
  GB: "GBP",
  JP: "JPY",
  DE: "EUR",
  FR: "EUR",
  IN: "INR",
  BR: "BRL",
  AU: "AUD",
  HK: "HKD",
  CN: "CNY",
  KR: "KRW",
  TW: "TWD",
  CH: "CHF",
  SG: "SGD",
  NL: "EUR",
  IT: "EUR",
  ES: "EUR",
  MX: "MXN",
  SE: "SEK",
  DK: "DKK",
  NO: "NOK",
  IL: "ILS",
  ZA: "ZAR",
  PL: "PLN",
  BE: "EUR",
  NZ: "NZD",
  FI: "EUR",
  AT: "EUR",
  IE: "EUR",
  PT: "EUR",
  GR: "EUR",
  CZ: "CZK",
  IS: "ISK",
  TR: "TRY",
  AR: "ARS",
  CL: "CLP",
  ID: "IDR",
  MY: "MYR",
  TH: "THB",
  SA: "SAR",
  AE: "AED",
  QA: "QAR",
  RU: "RUB",
};

const SUFFIX_CURRENCY: Record<string, string> = {
  T: "JPY",
  HK: "HKD",
  L: "GBP",
  PA: "EUR",
  DE: "EUR",
  F: "EUR",
  TO: "CAD",
  AX: "AUD",
  NS: "INR",
  SA: "BRL",
  SW: "CHF",
  KS: "KRW",
  TW: "TWD",
  SI: "SGD",
  AS: "EUR",
  MI: "EUR",
  MC: "EUR",
  MX: "MXN",
  ST: "SEK",
  CO: "DKK",
  OL: "NOK",
  TA: "ILS",
  JO: "ZAR",
  WA: "PLN",
  BR: "EUR",
  NZ: "NZD",
  HE: "EUR",
  VI: "EUR",
  IR: "EUR",
  LS: "EUR",
  AT: "EUR",
  PR: "CZK",
  IC: "ISK",
  IS: "TRY",
  BA: "ARS",
  SN: "CLP",
  SS: "CNY",
  SZ: "CNY",
  JK: "IDR",
  KL: "MYR",
  BK: "THB",
  SR: "SAR",
  AE: "AED",
  QA: "QAR",
  KQ: "KRW",
  BO: "INR",
  V: "CAD",
  CN: "CAD",
  NE: "CAD",
  TWO: "TWD",
  ME: "RUB",
  DU: "EUR",
  HM: "EUR",
  MU: "EUR",
  SG: "EUR",
  XD: "EUR",
};

export function currencyForCountry(country?: string | null) {
  if (!country) return "USD";
  return COUNTRY_CURRENCY[country.toUpperCase()] ?? "USD";
}

export function currencyForSymbol(symbol?: string | null) {
  if (!symbol) return "USD";
  const parts = symbol.toUpperCase().split(".");
  if (parts.length < 2) return "USD";
  return SUFFIX_CURRENCY[parts[parts.length - 1]] ?? "USD";
}

export function currencyForListing(symbol?: string | null, country?: string | null) {
  const fromSymbol = currencyForSymbol(symbol);
  if (fromSymbol !== "USD") return fromSymbol;
  return currencyForCountry(country);
}

export function compactMoneyFn(currency?: string | null) {
  return (value: number | null | undefined) => formatCompactMoney(value, currency);
}

export function reportingCurrency(...candidates: Array<string | number | null | undefined>) {
  for (const value of candidates) {
    if (typeof value === "string" && /^[A-Z]{3}$/i.test(value)) return value.toUpperCase();
  }
  return "USD";
}

export function formatCompactMoney(value: number | null | undefined, currency?: string | null) {
  if (value == null || Number.isNaN(value)) return "—";
  const code = (currency || "USD").toUpperCase();
  const sign = value < 0 ? "-" : "";
  const compact = formatCompact(Math.abs(value));
  if (!currency || code === "USD") return `${sign}$${compact}`;
  const prefix = CURRENCY_PREFIX[code];
  return prefix ? `${sign}${prefix}${compact}` : `${sign}${compact} ${code}`;
}

export function formatMillions(value: number | null | undefined) {
  if (value == null || Number.isNaN(value)) return "—";
  const millions = value / 1e6;
  const abs = Math.abs(millions);
  const digits = abs >= 100 ? 0 : abs >= 10 ? 1 : 2;
  return millions.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: digits,
  });
}

export function yearOverYear(current: unknown, previous: unknown) {
  if (typeof current !== "number" || typeof previous !== "number") return null;
  if (!Number.isFinite(current) || !Number.isFinite(previous) || previous === 0) return null;
  return (current - previous) / Math.abs(previous);
}

export function formatClock(value: string | null | undefined) {
  if (!value) return "";
  return value.replace(/\s*[-+][0-9]{2}:[0-9]{2}$/, "").replace(/^0/, "").trim();
}

export function formatPercent(
  value: number | null | undefined,
  { alreadyPercent = false, digits = 2 }: { alreadyPercent?: boolean; digits?: number } = {},
) {
  if (value == null || Number.isNaN(value)) return "—";
  const pct = alreadyPercent ? value : value * 100;
  const formatted = pct.toLocaleString("en-US", {
    minimumFractionDigits: Math.abs(pct) >= 1000 ? 0 : digits,
    maximumFractionDigits: Math.abs(pct) >= 1000 ? 0 : digits,
  });
  return `${pct > 0 ? "+" : ""}${formatted}%`;
}

export function formatPercentPlain(
  value: number | null | undefined,
  { alreadyPercent = false, digits = 2 }: { alreadyPercent?: boolean; digits?: number } = {},
) {
  if (value == null || Number.isNaN(value)) return "—";
  const pct = alreadyPercent ? value : value * 100;
  return `${pct.toLocaleString("en-US", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })}%`;
}

export function formatNumber(value: number | null | undefined, digits = 2) {
  if (value == null || Number.isNaN(value)) return "—";
  return value.toLocaleString("en-US", {
    minimumFractionDigits: Number.isInteger(value) ? 0 : Math.min(digits, 2),
    maximumFractionDigits: digits,
  });
}

export function formatInteger(value: number | null | undefined) {
  if (value == null || Number.isNaN(value)) return "—";
  return integerFormatter.format(value);
}

export function formatRatio(value: number | null | undefined, digits = 2) {
  if (value == null || Number.isNaN(value)) return "—";
  return value.toLocaleString("en-US", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

/** Hide nonsensical TTM P/E values that FMP returns for funds and some ETFs. */
export function formatPlausiblePe(value: number | null | undefined, digits = 2) {
  if (value == null || !Number.isFinite(value) || value <= 0 || value > 250) return "—";
  return formatRatio(value, digits);
}

export function formatAnalystConsensus(grades?: {
  consensus?: string | null;
  strongBuy?: number | null;
  buy?: number | null;
  hold?: number | null;
  sell?: number | null;
  strongSell?: number | null;
} | null) {
  if (!grades?.consensus) return "—";
  const count =
    (grades.strongBuy || 0) +
    (grades.buy || 0) +
    (grades.hold || 0) +
    (grades.sell || 0) +
    (grades.strongSell || 0);
  return count > 0 ? `${grades.consensus} (${count})` : grades.consensus;
}

export function formatVolume(value: number | null | undefined) {
  return formatInteger(value);
}

export function formatDate(
  value: string | null | undefined,
  options?: { month?: "short" | "long"; weekday?: boolean },
) {
  if (!value) return "—";
  const day = value.slice(0, 10);
  const date = /^\d{4}-\d{2}-\d{2}$/.test(day)
    ? new Date(`${day}T00:00:00`)
    : new Date(value.includes("T") ? value : `${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-US", {
    weekday: options?.weekday ? "long" : undefined,
    month: options?.month ?? "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatShortDate(value: string | null | undefined) {
  if (!value) return "—";
  const date = new Date(value.includes("T") ? value : `${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function formatRelativeTime(value: string | null | undefined) {
  if (!value) return "";
  const date = new Date(value.replace(" ", "T") + (value.includes("Z") ? "" : "Z"));
  if (Number.isNaN(date.getTime())) return value;
  const diff = Date.now() - date.getTime();
  const minutes = Math.round(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.round(hours / 24);
  if (days < 14) return `${days}d`;
  return formatDate(value);
}

export function isPositive(value: number | null | undefined) {
  return (value ?? 0) > 0;
}

export function changeClass(value: number | null | undefined) {
  if (value == null || value === 0) return "text-foreground";
  return value > 0 ? "text-gain" : "text-loss";
}

export function signedChange(change: number | null | undefined, percent: number | null | undefined) {
  if (change == null && percent == null) return "—";
  const changeText = change == null ? "" : `${change > 0 ? "+" : ""}${formatPrice(change)}`;
  const pctText = percent == null ? "" : formatPercent(percent, { alreadyPercent: true });
  if (changeText && pctText) return `${changeText} (${pctText})`;
  return changeText || pctText;
}

export function rangeLabel(range: string | null | undefined) {
  if (!range) return "—";
  const [low, high] = range.split("-").map((part) => Number(part));
  if (Number.isNaN(low) || Number.isNaN(high)) return range;
  return `${formatPrice(low)} - ${formatPrice(high)}`;
}
