import { yearOverYear } from "@/lib/format";
import type { FmpDividend } from "@/lib/types";
import { addDays, isoDate, nyDateString } from "@/lib/utils";

/** Payments to fetch so a weekly payer covers two 365-day windows (TTM and 1Y growth). */
export const DISTRIBUTION_TTM_LIMIT = 120;

export function payoutRatioFromDps(dps: number | null | undefined, eps: number | null | undefined) {
  if (typeof dps !== "number" || !Number.isFinite(dps) || typeof eps !== "number" || !(eps > 0)) return null;
  return dps / eps;
}

export function dividendYieldFromPrice(dps: number | null | undefined, price: number | null | undefined) {
  if (typeof dps !== "number" || !Number.isFinite(dps) || typeof price !== "number" || !(price > 0)) return null;
  return dps / price;
}

export function trailingDividendTotal(
  dividends: Array<{ dividend?: number; adjDividend?: number }>,
  start = 0,
  count = 4,
) {
  const slice = dividends.slice(start, start + count);
  if (slice.length < count) return null;
  let total = 0;
  for (const row of slice) {
    const value = row.adjDividend || row.dividend || 0;
    if (!Number.isFinite(value)) return null;
    total += value;
  }
  return total;
}

/**
 * Cash distributions with an ex-date in (asOf − days, asOf].
 * Use this for ETF/fund TTM; keep `trailingDividendTotal(..., 4)` for quarterly stock DPS columns.
 */
export function trailingDividendWindow(
  dividends: Array<{ date?: string; dividend?: number; adjDividend?: number }>,
  asOf: string,
  days = 365,
) {
  if (!asOf || dividends.length === 0) return null;
  const startMs = Date.parse(`${asOf}T00:00:00Z`);
  if (!Number.isFinite(startMs)) return null;
  const start = isoDate(addDays(new Date(startMs), -days));
  let total = 0;
  let count = 0;
  for (const row of dividends) {
    const date = row.date;
    if (!date || date > asOf || date <= start) continue;
    const value = row.adjDividend || row.dividend || 0;
    if (!Number.isFinite(value)) continue;
    total += value;
    count += 1;
  }
  return count > 0 ? total : null;
}

/** Last four payments on or before a statement date, for trailing income columns. */
export function trailingDividendThrough(
  dividends: Array<{ date: string; dividend?: number; adjDividend?: number }>,
  endDate: string,
  count = 4,
) {
  const eligible = dividends
    .filter((row) => row.date && row.date <= endDate)
    .sort((a, b) => b.date.localeCompare(a.date));
  return trailingDividendTotal(eligible, 0, count);
}

/**
 * Trailing-year cash versus the prior year, for labels such as Dividend Growth (1Y).
 * Returns null when history does not reach the start of the prior window (truncated or too new).
 * Keep `trailingDividendTotal(..., 4)` for quarterly DPS columns on statements.
 */
export function dividendTtmGrowth(
  dividends: Array<{ date?: string; dividend?: number; adjDividend?: number }>,
  asOf = nyDateString(),
) {
  const endMs = Date.parse(`${asOf}T00:00:00Z`);
  if (!Number.isFinite(endMs)) return null;
  const priorEnd = isoDate(addDays(new Date(endMs), -365));
  const priorStart = isoDate(addDays(new Date(endMs), -730));
  const coversPriorYear = dividends.some((row) => row.date && row.date <= priorStart);
  if (!coversPriorYear) return null;
  return yearOverYear(trailingDividendWindow(dividends, asOf), trailingDividendWindow(dividends, priorEnd));
}

export function consecutiveDividendGrowthYears(byYear: Map<string, number>, yearsAscending: string[]) {
  let growthYears = 0;
  for (let i = yearsAscending.length - 1; i > 0; i -= 1) {
    const current = byYear.get(yearsAscending[i]) ?? 0;
    const previous = byYear.get(yearsAscending[i - 1]) ?? 0;
    if (previous > 0 && current > previous) growthYears += 1;
    else break;
  }
  return growthYears;
}

export function fiscalYearForDate(
  date: string,
  fiscalEnds: Array<{ fiscalYear?: string | number; date?: string }>,
) {
  const ranked = [...fiscalEnds]
    .filter((row) => row.date && row.fiscalYear != null)
    .sort((a, b) => String(a.date).localeCompare(String(b.date)));
  for (const row of ranked) {
    if (date <= String(row.date)) return String(row.fiscalYear);
  }
  const last = ranked[ranked.length - 1];
  if (last) {
    const year = Number(last.fiscalYear);
    if (Number.isFinite(year)) return String(year + 1);
  }
  return String(date).slice(0, 4);
}

export function dividendsByFiscalYear(
  dividends: FmpDividend[],
  fiscalEnds: Array<{ fiscalYear?: string | number; date?: string }>,
) {
  const byYear = new Map<string, number>();
  for (const row of dividends) {
    const year = fiscalYearForDate(row.date, fiscalEnds);
    const amount = row.adjDividend || row.dividend || 0;
    byYear.set(year, (byYear.get(year) ?? 0) + amount);
  }
  return byYear;
}
