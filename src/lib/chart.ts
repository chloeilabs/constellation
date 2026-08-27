import type { FmpIntradayCandle, FmpLightCandle, ChartPoint } from "@/lib/types";
import { addDays, isoDate, nyDateString } from "@/lib/utils";
import { getDailyChart, getIntradayChart } from "@/lib/fmp";

export const CHART_RANGES = ["1D", "5D", "1M", "YTD", "3M", "6M", "1Y", "5Y", "MAX"] as const;
export type ChartRange = (typeof CHART_RANGES)[number];

function toDailyPoints(rows: FmpLightCandle[]): ChartPoint[] {
  return [...rows]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((row) => ({ time: row.date, value: row.price, volume: row.volume }));
}

function toIntradayPoints(rows: FmpIntradayCandle[]): ChartPoint[] {
  return [...rows]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((row) => ({ time: row.date, value: row.close, volume: row.volume }));
}

function fromDateForRange(range: ChartRange) {
  const today = new Date(`${nyDateString()}T00:00:00Z`);
  switch (range) {
    case "1M":
      return isoDate(addDays(today, -35));
    case "3M":
      return isoDate(addDays(today, -100));
    case "6M":
      return isoDate(addDays(today, -200));
    case "YTD":
      return `${today.getUTCFullYear()}-01-01`;
    case "1Y":
      return isoDate(addDays(today, -400));
    case "5Y":
      return isoDate(addDays(today, -365 * 5 - 20));
    default:
      return undefined;
  }
}

export async function getChartData(symbol: string, range: ChartRange): Promise<ChartPoint[]> {
  if (range === "1D") {
    return toIntradayPoints(await getIntradayChart(symbol, "5min")).slice(-90);
  }
  if (range === "5D") {
    return toIntradayPoints(await getIntradayChart(symbol, "15min")).slice(-200);
  }
  if (range === "MAX") {
    return toDailyPoints(await getDailyChart(symbol));
  }
  return toDailyPoints(await getDailyChart(symbol, fromDateForRange(range)));
}
