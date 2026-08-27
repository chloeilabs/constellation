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
