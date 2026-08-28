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
