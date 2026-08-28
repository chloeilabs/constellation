import type { FmpAdjustedCandle, FmpIntradayCandle, FmpLightCandle, ChartPoint } from "@/lib/types";
import { addDays, isoDate, nyDateString, nySession, type NySession } from "@/lib/utils";
import { getDailyChart, getDividendAdjustedChart, getIntradayChart, getTechnicalSeries } from "@/lib/fmp";
import { resolveChartRange, type ChartRange } from "@/lib/chart-range";

export { CHART_RANGES, defaultChartRange, resolveChartRange, type ChartRange } from "@/lib/chart-range";

function toDailyPoints(rows: FmpLightCandle[]): ChartPoint[] {
  return [...rows]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((row) => ({ time: row.date, value: row.price, volume: row.volume }));
}

function toAdjustedPoints(rows: FmpAdjustedCandle[]): ChartPoint[] {
  return [...rows]
    .filter((row) => typeof row.adjClose === "number" && Number.isFinite(row.adjClose))
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((row) => ({ time: row.date, value: row.adjClose, volume: row.volume }));
}

function smaFromPoints(points: ChartPoint[], period: number): ChartPoint[] {
  if (period < 1 || points.length < period) return [];
  const out: ChartPoint[] = [];
  let sum = 0;
  for (let i = 0; i < points.length; i++) {
    sum += points[i].value;
    if (i >= period) sum -= points[i - period].value;
    if (i >= period - 1) out.push({ time: points[i].time, value: sum / period });
  }
  return out;
}

function sliceFrom(points: ChartPoint[], from?: string) {
  if (!from) return points;
  return points.filter((point) => point.time.slice(0, 10) >= from);
}

export function canDividendAdjust(range: ChartRange) {
  return range !== "1D" && range !== "5D";
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

/** Seeded EMA from the first `period` closes, then the standard multiplier update. */
export function emaSeries(points: ChartPoint[], period: number): ChartPoint[] {
  if (period < 1 || points.length < period) return [];
  const k = 2 / (period + 1);
  let ema = 0;
  for (let i = 0; i < period; i++) ema += points[i].value;
  ema /= period;
  const out: ChartPoint[] = [{ time: points[period - 1].time, value: ema }];
  for (let i = period; i < points.length; i++) {
    ema = points[i].value * k + ema * (1 - k);
    out.push({ time: points[i].time, value: ema });
  }
  return out;
}

/** Wilder RSI from close-to-close changes. Computed locally so the chart does not spend extra FMP calls. */
export function rsiSeries(points: ChartPoint[], period = 14): ChartPoint[] {
  if (period < 1 || points.length <= period) return [];
  let gain = 0;
  let loss = 0;
  for (let i = 1; i <= period; i++) {
    const change = points[i].value - points[i - 1].value;
    if (change >= 0) gain += change;
    else loss -= change;
  }
  let avgGain = gain / period;
  let avgLoss = loss / period;
  const out: ChartPoint[] = [];
  const push = (index: number) => {
    const rsi = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);
    out.push({ time: points[index].time, value: rsi });
  };
  push(period);
  for (let i = period + 1; i < points.length; i++) {
    const change = points[i].value - points[i - 1].value;
    const up = change > 0 ? change : 0;
    const down = change < 0 ? -change : 0;
    avgGain = (avgGain * (period - 1) + up) / period;
    avgLoss = (avgLoss * (period - 1) + down) / period;
    push(i);
  }
  return out;
}

/** MACD(12,26,9) from local EMAs: line = EMA12 − EMA26, signal = 9-period EMA of the line. */
export function macdFromPoints(points: ChartPoint[]) {
  const fast = emaSeries(points, 12);
  const slow = emaSeries(points, 26);
  const fastByDay = new Map(fast.map((point) => [point.time.slice(0, 10), point.value]));
  const macdLine: ChartPoint[] = [];
  for (const point of slow) {
    const ema12 = fastByDay.get(point.time.slice(0, 10));
    if (ema12 == null) continue;
    macdLine.push({ time: point.time, value: ema12 - point.value });
  }
  const signal = emaSeries(macdLine, 9);
  const signalByDay = new Map(signal.map((point) => [point.time.slice(0, 10), point.value]));
  const histogram: ChartPoint[] = [];
  for (const point of macdLine) {
    const sig = signalByDay.get(point.time.slice(0, 10));
    if (sig == null) continue;
    histogram.push({ time: point.time, value: point.value - sig });
  }
  return { macdSeries: macdLine, macdSignalSeries: signal, macdHistogramSeries: histogram };
}

function dailyIndicatorSeries(points: ChartPoint[], range: ChartRange) {
  if (range === "1D" || range === "5D") {
    return {
      ema12Series: [] as ChartPoint[],
      ema26Series: [] as ChartPoint[],
      rsiSeries: [] as ChartPoint[],
      macdSeries: [] as ChartPoint[],
      macdSignalSeries: [] as ChartPoint[],
      macdHistogramSeries: [] as ChartPoint[],
    };
  }
  return {
    ema12Series: emaSeries(points, 12),
    ema26Series: emaSeries(points, 26),
    rsiSeries: rsiSeries(points, 14),
    ...macdFromPoints(points),
  };
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

function lastSessionPoints(points: ChartPoint[], sessionCount: number, rthOnly = true) {
  if (points.length === 0) return points;
  const dates = [...new Set(points.map((point) => point.time.slice(0, 10)))].sort();
  const keep = new Set(dates.slice(-sessionCount));
  let out = points.filter((point) => keep.has(point.time.slice(0, 10)));
  if (rthOnly) {
    const rth = out.filter((point) => inWindow(point.time, RTH_START, RTH_END));
    if (rth.length >= 20) out = rth;
  }
  return out;
}

export async function getChartData(symbol: string, range: ChartRange): Promise<ChartPoint[]> {
  if (range === "1D") {
    const oneMin = sessionChartPoints(toIntradayPoints(await getIntradayChart(symbol, "1min")));
    if (oneMin.length >= 2) return oneMin;
    const fiveMin = sessionChartPoints(toIntradayPoints(await getIntradayChart(symbol, "5min")));
    return fiveMin.length >= 2 ? fiveMin : oneMin;
  }
  if (range === "5D") {
    const fiveMin = lastSessionPoints(toIntradayPoints(await getIntradayChart(symbol, "5min")), 5);
    if (fiveMin.length >= 20) return fiveMin;
    return lastSessionPoints(toIntradayPoints(await getIntradayChart(symbol, "15min")), 5);
  }
  if (range === "MAX") {
    return toDailyPoints(await getDailyChart(symbol));
  }
  return toDailyPoints(await getDailyChart(symbol, fromDateForRange(range)));
}

export async function loadQuoteChart(
  symbol: string,
  rangeParam?: string | null,
  options?: { adjusted?: boolean },
) {
  const range = resolveChartRange(rangeParam);
  const adjusted = Boolean(options?.adjusted) && canDividendAdjust(range);
  if (adjusted) {
    const chartFrom = fromDateForRange(range);
    const today = new Date(`${nyDateString()}T00:00:00Z`);
    const lookbackFrom =
      range === "MAX"
        ? undefined
        : isoDate(addDays(chartFrom ? new Date(`${chartFrom}T00:00:00Z`) : today, -420));
    const full = toAdjustedPoints(await getDividendAdjustedChart(symbol, lookbackFrom));
    const points = sliceFrom(full, chartFrom);
    return {
      range,
      points,
      adjusted: true,
      ma50Series: smaFromPoints(full, 50),
      ma200Series: smaFromPoints(full, 200),
      ...dailyIndicatorSeries(points, range),
    };
  }
  const [points, averages] = await Promise.all([getChartData(symbol, range), getChartMovingAverages(symbol, range)]);
  return {
    range,
    points,
    adjusted: false,
    ma50Series: averages.ma50,
    ma200Series: averages.ma200,
    ...dailyIndicatorSeries(points, range),
  };
}
