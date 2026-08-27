import { nySession } from "@/lib/utils";

export const CHART_RANGES = ["1D", "5D", "1M", "YTD", "3M", "6M", "1Y", "5Y", "MAX"] as const;
export type ChartRange = (typeof CHART_RANGES)[number];

/** Intraday 1D while the U.S. cash session is open or in extended hours; 1Y when the market is closed. */
export function defaultChartRange(): ChartRange {
  return nySession() === "closed" ? "1Y" : "1D";
}

export function resolveChartRange(param?: string | null): ChartRange {
  if (param && CHART_RANGES.includes(param as ChartRange)) return param as ChartRange;
  return defaultChartRange();
}
