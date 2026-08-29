import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function first<T>(items: T[] | null | undefined): T | null {
  return items?.[0] ?? null;
}

export function chunk<T>(items: T[], size: number) {
  const groups: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    groups.push(items.slice(i, i + size));
  }
  return groups;
}

export function isoDate(d = new Date()) {
  return d.toISOString().slice(0, 10);
}

export function addDays(d: Date, days: number) {
  const next = new Date(d);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

export function nyDateString(d = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

export function recentFiscalQuarters(count = 6) {
  const now = new Date();
  let year = now.getUTCFullYear();
  let quarter = Math.floor(now.getUTCMonth() / 3) + 1;
  const periods: { year: number; quarter: number }[] = [];
  for (let i = 0; i < count; i++) {
    periods.push({ year, quarter });
    quarter -= 1;
    if (quarter < 1) {
      quarter = 4;
      year -= 1;
    }
  }
  return periods;
}

export function yearEndSnapshots<T extends { date: string }>(rows: T[]) {
  const newestFirst = [...rows].sort((a, b) => b.date.localeCompare(a.date));
  const byYear = new Map<string, T>();
  for (const row of newestFirst) {
    const year = row.date.slice(0, 4);
    if (!byYear.has(year)) byYear.set(year, row);
  }
  return [...byYear.entries()]
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([, row]) => row);
}

export function parseWeightPercentage(value: string | number | null | undefined) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number.parseFloat(value.replace(/%/g, "").trim());
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

export function percentFromPriceChange(price: number | null | undefined, change: number | null | undefined) {
  if (price == null || change == null || !Number.isFinite(price) || !Number.isFinite(change)) return null;
  const previous = price - change;
  if (!previous) return null;
  return change / previous;
}

/** `(current - prior) / |prior|` as a decimal, or null when either side is missing. */
export function relativeChange(current?: number | null, prior?: number | null) {
  if (typeof current !== "number" || typeof prior !== "number") return null;
  if (!Number.isFinite(current) || !Number.isFinite(prior) || prior === 0) return null;
  return (current - prior) / Math.abs(prior);
}

/** Magnitude of a cash-flow outlay. FMP reports buybacks and dividends paid as negatives. */
export function cashOutlay(value: number | null | undefined) {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  return Math.abs(value);
}

function finiteNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

/** Cash + marketable securities, including long-term investments (Stock Analysis "Cash & Investments"). */
export function cashAndInvestments(sheet?: {
  cashAndShortTermInvestments?: number;
  longTermInvestments?: number;
} | null) {
  const short = finiteNumber(sheet?.cashAndShortTermInvestments);
  const long = finiteNumber(sheet?.longTermInvestments);
  if (short == null && long == null) return null;
  return (short ?? 0) + (long ?? 0);
}

/** Cash & investments minus total debt. Positive is net cash; negative is net debt. */
export function netCashPosition(sheet?: {
  cashAndShortTermInvestments?: number;
  longTermInvestments?: number;
  totalDebt?: number;
} | null) {
  const cash = cashAndInvestments(sheet);
  const debt = finiteNumber(sheet?.totalDebt);
  if (cash == null || debt == null) return null;
  return cash - debt;
}

export function annualDividendPayments(frequency: string | null | undefined) {
  const value = (frequency || "").toLowerCase();
  if (value.includes("bi-week") || value.includes("biweek") || value.includes("bi week")) return 26;
  if (value.includes("week")) return 52;
  if (value.includes("month")) return 12;
  if (value.includes("quarter")) return 4;
  if (value.includes("semi")) return 2;
  if (value.includes("annual") || value.includes("year")) return 1;
  return 4;
}

export function payoutFrequencyLabel(frequency: string | null | undefined) {
  if (!frequency) return null;
  const count = annualDividendPayments(frequency);
  if (count === 52) return "Weekly";
  if (count === 26) return "Bi-Weekly";
  if (count === 12) return "Monthly";
  if (count === 4) return "Quarterly";
  if (count === 2) return "Semi-Annual";
  if (count === 1) return "Annual";
  return frequency;
}

export function payoutFrequencyProse(frequency: string | null | undefined) {
  const count = annualDividendPayments(frequency);
  if (!frequency) return null;
  if (count === 52) return "every week";
  if (count === 26) return "every two weeks";
  if (count === 12) return "every month";
  if (count === 4) return "every three months";
  if (count === 2) return "twice a year";
  if (count === 1) return "once a year";
  return null;
}

/** Indicated annual dividend from the latest payment, matching Stock Analysis quote stats. */
export function indicatedAnnualDividend(
  dividend?: { dividend?: number | null; frequency?: string | null } | null,
  fallback?: number | null,
) {
  const latest = dividend?.dividend;
  if (typeof latest === "number" && Number.isFinite(latest) && latest > 0) {
    return latest * annualDividendPayments(dividend?.frequency);
  }
  return typeof fallback === "number" && Number.isFinite(fallback) ? fallback : null;
}

export type NySession = "premarket" | "open" | "afterhours" | "closed";

/** Regular U.S. cash session in America/New_York: 9:30–16:00 on weekdays. */
export function nySession(now = new Date()): NySession {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    weekday: "short",
    hour: "numeric",
    minute: "numeric",
    hourCycle: "h23",
  }).formatToParts(now);
  const weekday = parts.find((part) => part.type === "weekday")?.value;
  if (weekday === "Sat" || weekday === "Sun") return "closed";
  const hour = Number(parts.find((part) => part.type === "hour")?.value);
  const minute = Number(parts.find((part) => part.type === "minute")?.value);
  const mins = hour * 60 + minute;
  if (mins >= 4 * 60 && mins < 9 * 60 + 30) return "premarket";
  if (mins >= 9 * 60 + 30 && mins < 16 * 60) return "open";
  if (mins >= 16 * 60 && mins < 20 * 60) return "afterhours";
  return "closed";
}

export function isExtendedSession(now = new Date()) {
  const session = nySession(now);
  return session === "premarket" || session === "afterhours";
}

export function nyExtendedKind(now = new Date()): "premarket" | "afterhours" {
  return nySession(now) === "premarket" ? "premarket" : "afterhours";
}

export function nyExtendedCopy(kind: "premarket" | "afterhours" = nyExtendedKind()) {
  return kind === "premarket"
    ? { label: "Pre-market", title: "Pre-Market", href: "/markets/premarket" as const }
    : { label: "After hours", title: "After Hours", href: "/markets/afterhours" as const };
}
