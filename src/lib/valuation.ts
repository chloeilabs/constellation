import type { FmpEstimate } from "@/lib/types";
import { nyDateString } from "@/lib/utils";

function rankedEstimates(estimates: FmpEstimate[]) {
  return [...estimates].filter((row) => row.date).sort((a, b) => a.date.localeCompare(b.date));
}

export function nextEstimate(estimates: FmpEstimate[], today = nyDateString()) {
  const ranked = rankedEstimates(estimates);
  return ranked.find((row) => row.date >= today) ?? ranked[0] ?? null;
}

export function forwardPe(price: number | null | undefined, estimates: FmpEstimate[]) {
  if (price == null || !(price > 0)) return null;
  const next = nextEstimate(estimates);
  if (!next?.epsAvg || next.epsAvg <= 0) return null;
  return price / next.epsAvg;
}

export function forwardPs(marketCap: number | null | undefined, estimates: FmpEstimate[]) {
  if (marketCap == null || !(marketCap > 0)) return null;
  const next = nextEstimate(estimates);
  if (!next?.revenueAvg || next.revenueAvg <= 0) return null;
  return marketCap / next.revenueAvg;
}

export function estimateCagr(estimates: FmpEstimate[], field: "revenueAvg" | "epsAvg", minYears = 2) {
  const next = nextEstimate(estimates);
  const start = next?.[field];
  if (!next || start == null || start <= 0) return null;
  const startYear = Number.parseInt(next.date.slice(0, 4), 10);
  if (!Number.isFinite(startYear)) return null;
  const later = [...estimates]
    .filter((row) => {
      const year = Number.parseInt(row.date.slice(0, 4), 10);
      const value = row[field];
      return Number.isFinite(year) && year - startYear >= minYears && typeof value === "number" && value > 0;
    })
    .sort((a, b) => b.date.localeCompare(a.date))[0];
  if (!later) return null;
  const end = later[field];
  const years = Number.parseInt(later.date.slice(0, 4), 10) - startYear;
  if (end == null || end <= 0 || years <= 0) return null;
  return Math.pow(end / start, 1 / years) - 1;
}

export function trailingPe(price: number | null | undefined, eps: number | null | undefined) {
  if (price == null || !(price > 0) || eps == null || !(eps > 0)) return null;
  return price / eps;
}

export function marketCapFromPrice(price: number | null | undefined, shares: number | null | undefined) {
  if (price == null || shares == null || !(price > 0) || !(shares > 0)) return null;
  return price * shares;
}

export function pegRatio(pe: number | null | undefined, growth: number | null | undefined) {
  if (pe == null || !(pe > 0) || growth == null || !(growth > 0)) return null;
  return pe / (growth * 100);
}

/** Inverse of share-count change. Shrinking shares is a positive buyback/dilution yield. */
export function buybackYieldFromShareChange(sharesYoy: number | null | undefined) {
  if (sharesYoy == null || !Number.isFinite(sharesYoy)) return null;
  return -sharesYoy;
}

/** Peter Lynch fair value: EPS × (1 + g%) with g as a whole-number percent and PEG = 1. */
export function lynchFairValue(eps: number | null | undefined, growth: number | null | undefined) {
  if (eps == null || !(eps > 0) || growth == null || !(growth > 0)) return null;
  return eps * (1 + growth * 100);
}

/** CAGR from the last reported period to the matching estimate `years` later. */
export function actualToEstimateCagr(
  actualValue: number | null | undefined,
  actualDate: string | null | undefined,
  estimates: FmpEstimate[],
  field: "revenueAvg" | "epsAvg",
  years = 3,
) {
  if (actualValue == null || actualValue <= 0 || !actualDate) return null;
  const startYear = Number.parseInt(actualDate.slice(0, 4), 10);
  if (!Number.isFinite(startYear) || years <= 0) return null;
  const targetYear = startYear + years;
  const later = [...estimates]
    .filter((row) => {
      if (!row.date || row.date <= actualDate) return false;
      const year = Number.parseInt(row.date.slice(0, 4), 10);
      const value = row[field];
      return year === targetYear && typeof value === "number" && value > 0;
    })
    .sort((a, b) => a.date.localeCompare(b.date))[0];
  const end = later?.[field];
  if (end == null || end <= 0) return null;
  return Math.pow(end / actualValue, 1 / years) - 1;
}

export function futureEstimates(estimates: FmpEstimate[], today = nyDateString()) {
  return rankedEstimates(estimates).filter((row) => row.date >= today);
}

function finite(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function ratio(numerator: number | null, denominator: number | null) {
  if (numerator == null || denominator == null || denominator === 0) return null;
  return numerator / denominator;
}

/** Price, EV, leverage, and yield ratios from live price and filings (cash includes marketable securities). */
export function derivedValuationMetrics(input: {
  price?: number | null;
  marketCap?: number | null;
  equity?: number | null;
  tangibleEquity?: number | null;
  bookPerShare?: number | null;
  tangibleBookPerShare?: number | null;
  totalDebt?: number | null;
  netCash?: number | null;
  revenue?: number | null;
  eps?: number | null;
  ebit?: number | null;
  ebitda?: number | null;
  fcf?: number | null;
  ocf?: number | null;
  netIncome?: number | null;
  sharesYoy?: number | null;
  dividendYield?: number | null;
  nextEps?: number | null;
  epsCagr?: number | null;
}) {
  const price = finite(input.price);
  const marketCap = finite(input.marketCap);
  const netCash = finite(input.netCash);
  const enterpriseValue = marketCap != null && netCash != null ? marketCap - netCash : null;
  const pe = trailingPe(price, input.eps);
  const buybackYield = buybackYieldFromShareChange(finite(input.sharesYoy));
  const dividendYield = finite(input.dividendYield);
  const netDebt = netCash != null ? -netCash : null;
  return {
    lastClosePrice: price,
    marketCap,
    enterpriseValue,
    priceToEarningsRatio: pe,
    forwardPe: trailingPe(price, input.nextEps),
    priceToSalesRatio: ratio(marketCap, finite(input.revenue)),
    priceToBookRatio: ratio(price, finite(input.bookPerShare)) ?? ratio(marketCap, finite(input.equity)),
    priceToTangibleBookRatio:
      ratio(price, finite(input.tangibleBookPerShare)) ?? ratio(marketCap, finite(input.tangibleEquity)),
    priceToFreeCashFlowRatio: ratio(marketCap, finite(input.fcf)),
    priceToOperatingCashFlowRatio: ratio(marketCap, finite(input.ocf)),
    priceToEarningsGrowthRatio: pegRatio(pe, input.epsCagr),
    evToSales: ratio(enterpriseValue, finite(input.revenue)),
    evToEBITDA: ratio(enterpriseValue, finite(input.ebitda)),
    evToEBIT: ratio(enterpriseValue, finite(input.ebit)),
    evToOperatingCashFlow: ratio(enterpriseValue, finite(input.ocf)),
    evToFreeCashFlow: ratio(enterpriseValue, finite(input.fcf)),
    evToEarnings: ratio(enterpriseValue, finite(input.netIncome)),
    debtToEquityRatio: ratio(finite(input.totalDebt), finite(input.equity)),
    debtToEbitda: ratio(finite(input.totalDebt), finite(input.ebitda)),
    debtToFcf: ratio(finite(input.totalDebt), finite(input.fcf)),
    netDebtToEquity: ratio(netDebt, finite(input.equity)),
    netDebtToEBITDA: ratio(netDebt, finite(input.ebitda)),
    netDebtToFcf: ratio(netDebt, finite(input.fcf)),
    earningsYield: pe != null && pe > 0 ? 1 / pe : null,
    freeCashFlowYield: ratio(finite(input.fcf), marketCap),
    buybackYield,
    shareholderYield:
      buybackYield != null || dividendYield != null ? (buybackYield ?? 0) + (dividendYield ?? 0) : null,
  };
}

/** Graham Number: sqrt(22.5 × EPS × book value per share). */
export function grahamNumber(eps: number | null | undefined, bookPerShare: number | null | undefined) {
  const earnings = finite(eps);
  const book = finite(bookPerShare);
  if (earnings == null || book == null || earnings <= 0 || book <= 0) return null;
  return Math.sqrt(22.5 * earnings * book);
}

/**
 * Original Altman Z-Score. Working capital, retained earnings, EBIT, and sales are
 * scaled by total assets; market cap is scaled by total liabilities.
 */
export function altmanZScore(input: {
  marketCap?: number | null;
  workingCapital?: number | null;
  totalAssets?: number | null;
  retainedEarnings?: number | null;
  ebit?: number | null;
  totalLiabilities?: number | null;
  revenue?: number | null;
}) {
  const assets = finite(input.totalAssets);
  const liabilities = finite(input.totalLiabilities);
  if (assets == null || assets === 0 || liabilities == null || liabilities === 0) return null;
  const a = (finite(input.workingCapital) ?? 0) / assets;
  const b = (finite(input.retainedEarnings) ?? 0) / assets;
  const c = (finite(input.ebit) ?? 0) / assets;
  const d = (finite(input.marketCap) ?? 0) / liabilities;
  const e = (finite(input.revenue) ?? 0) / assets;
  return 1.2 * a + 1.4 * b + 3.3 * c + 0.6 * d + 1.0 * e;
}

/** Copy finite numeric overlay fields onto a statement column without wiping existing values with nulls. */
export function assignFinite<T extends Record<string, unknown>>(base: T, overlay: Record<string, unknown>): T {
  const next = { ...base };
  for (const [key, value] of Object.entries(overlay)) {
    if (typeof value === "number" && Number.isFinite(value)) {
      (next as Record<string, unknown>)[key] = value;
    }
  }
  return next;
}
