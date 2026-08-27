import type { FmpIntradayCandle, FmpLightCandle, ChartPoint } from "@/lib/types";
import { addDays, isoDate, nyDateString, nySession, type NySession } from "@/lib/utils";
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

const RTH_START = 9 * 60 + 30;
const RTH_END = 16 * 60;
const EXT_START = 4 * 60;
const EXT_END = 20 * 60;

function minutesOf(time: string) {
  const match = time.match(/(\d{2}):(\d{2})/);
  if (!match) return null;
  return Number(match[1]) * 60 + Number(match[2]);
}

function inWindow(time: string, startMin: number, endMin: number) {
  const mins = minutesOf(time);
  return mins != null && mins >= startMin && mins < endMin;
}

function pointsOnDate(points: ChartPoint[], date: string) {
  return points.filter((point) => point.time.slice(0, 10) === date);
}

function previousDate(points: ChartPoint[], before: string) {
  const dates = [...new Set(points.map((point) => point.time.slice(0, 10)).filter((date) => date < before))].sort();
  return dates.at(-1) ?? null;
}

/** Keep the visible 1D window aligned with the current NY session, matching stockanalysis.com. */
export function sessionChartPoints(points: ChartPoint[], session: NySession = nySession()): ChartPoint[] {
  if (points.length === 0) return points;
  const today = nyDateString();
  const todays = pointsOnDate(points, today);

  if (session === "open") {
    const rth = todays.filter((point) => inWindow(point.time, RTH_START, RTH_END));
    if (rth.length >= 1) return rth;
    if (todays.length >= 1) return todays;
  }

  if (session === "premarket") {
    const pre = todays.filter((point) => inWindow(point.time, EXT_START, RTH_START));
    if (pre.length >= 2) return pre;
    const prior = previousDate(points, today);
    if (prior) {
      const priorRth = pointsOnDate(points, prior).filter((point) => inWindow(point.time, RTH_START, RTH_END));
      const combined = [...(priorRth.length >= 10 ? priorRth : pointsOnDate(points, prior)), ...pre];
      if (combined.length >= 2) return combined;
    }
    if (pre.length) return pre;
  }

  if (session === "afterhours") {
    const day = todays.filter((point) => inWindow(point.time, RTH_START, EXT_END));
    if (day.length >= 2) return day;
    if (todays.length >= 2) return todays;
  }

  const sessionDate = todays.length >= 10 ? today : points.at(-1)?.time.slice(0, 10);
  if (!sessionDate) return points.slice(-390);
  const day = pointsOnDate(points, sessionDate);
  const rthAh = day.filter((point) => inWindow(point.time, RTH_START, EXT_END));
  if (rthAh.length >= 10) return rthAh;
  const rth = day.filter((point) => inWindow(point.time, RTH_START, RTH_END));
  if (rth.length >= 10) return rth;
  return day.length >= 10 ? day : points.slice(-390);
}

export async function getChartData(symbol: string, range: ChartRange): Promise<ChartPoint[]> {
  if (range === "1D") {
    const oneMin = sessionChartPoints(toIntradayPoints(await getIntradayChart(symbol, "1min")));
    if (oneMin.length >= 2) return oneMin;
    const fiveMin = sessionChartPoints(toIntradayPoints(await getIntradayChart(symbol, "5min")));
    return fiveMin.length >= 2 ? fiveMin : oneMin;
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
