import type { FmpIntradayCandle, FmpLightCandle, ChartPoint } from "@/lib/types";
import { addDays, isoDate, nyDateString } from "@/lib/utils";
import { getDailyChart, getIntradayChart, getTechnicalSeries } from "@/lib/fmp";
import { resolveChartRange, type ChartRange } from "@/lib/chart-range";

export { CHART_RANGES, defaultChartRange, resolveChartRange, type ChartRange } from "@/lib/chart-range";

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

function smaPoints(rows: Awaited<ReturnType<typeof getTechnicalSeries>>): ChartPoint[] {
  return [...rows]
    .filter((row) => typeof row.sma === "number" && Number.isFinite(row.sma))
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((row) => ({ time: row.date, value: row.sma as number }));
}

export async function getChartMovingAverages(symbol: string, range: ChartRange) {
  if (range === "1D" || range === "5D" || range === "MAX") {
    return { ma50: [] as ChartPoint[], ma200: [] as ChartPoint[] };
  }
  const chartFrom = fromDateForRange(range);
  const today = new Date(`${nyDateString()}T00:00:00Z`);
  // SMA(200) needs ~200 trading sessions of history before the first visible bar.
  const smaFrom = isoDate(addDays(chartFrom ? new Date(`${chartFrom}T00:00:00Z`) : today, -420));
  const [sma50, sma200] = await Promise.all([
    getTechnicalSeries(symbol, "sma", 50, smaFrom),
    getTechnicalSeries(symbol, "sma", 200, smaFrom),
  ]);
  return { ma50: smaPoints(sma50), ma200: smaPoints(sma200) };
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

export async function loadQuoteChart(symbol: string, rangeParam?: string | null) {
  const range = resolveChartRange(rangeParam);
  const [points, averages] = await Promise.all([getChartData(symbol, range), getChartMovingAverages(symbol, range)]);
  return { range, points, ma50Series: averages.ma50, ma200Series: averages.ma200 };
}
