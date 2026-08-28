import {
  getBalanceSheets,
  getCashFlowTtm,
  getDividendAdjustedChart,
  getEstimates,
  getGradesConsensus,
  getIncomeTtm,
  getPriceTarget,
  getProfile,
  getQuote,
} from "@/lib/fmp";
import { downsampleChartPoints, loadVehiclePerformance } from "@/lib/chart";
import { type CompareChartSpan } from "@/lib/compare-chart";
import { valuationFromFilings } from "@/lib/period-valuation";
import { derivedStatementMetrics } from "@/lib/statements";
import type { ChartPoint } from "@/lib/types";
import { addDays, indicatedAnnualDividend, isoDate, nyDateString } from "@/lib/utils";
import { estimateCagr, nextEstimate } from "@/lib/valuation";

export {
  COMPARE_CHART_SPANS,
  compareChartHref,
  compareChartSpan,
  type CompareChartSpan,
} from "@/lib/compare-chart";

export const POPULAR_STOCK_COMPARISONS = [
  ["AAPL", "MSFT"],
  ["AAPL", "GOOGL"],
  ["NVDA", "AMD"],
  ["AMZN", "WMT"],
  ["META", "GOOGL"],
  ["JPM", "BAC"],
  ["V", "MA"],
  ["KO", "PEP"],
  ["XOM", "CVX"],
  ["TSLA", "F"],
  ["UNH", "JNJ"],
  ["COST", "WMT"],
] as const;

export async function getProfilesAndQuotes(symbols: string[]) {
  return Promise.all(
    symbols.map(async (symbol) => {
      const profilePromise = getProfile(symbol);
      const [quote, profile, ttm, cash, sheets, estimates, target, grades, performance] = await Promise.all([
        getQuote(symbol),
        profilePromise,
        getIncomeTtm(symbol),
        getCashFlowTtm(symbol),
        getBalanceSheets(symbol, "quarter", 5),
        getEstimates(symbol, "annual"),
        getPriceTarget(symbol),
        getGradesConsensus(symbol),
        profilePromise.then((company) => loadVehiclePerformance(symbol, company?.ipoDate)),
      ]);
      const live = valuationFromFilings({
        price: quote?.price,
        marketCap: quote?.marketCap,
        income: ttm as unknown as Record<string, unknown> | null,
        cash: cash as unknown as Record<string, unknown> | null,
        balance: (sheets[0] ?? null) as unknown as Record<string, unknown> | null,
        priorBalance: (sheets[4] ?? sheets[1] ?? null) as unknown as Record<string, unknown> | null,
        daysInPeriod: 365,
        nextEps: nextEstimate(estimates)?.epsAvg,
        epsCagr: estimateCagr(estimates, "epsAvg", 3),
      });
      const margins = ttm
        ? derivedStatementMetrics({
            ...(ttm as unknown as Record<string, unknown>),
            freeCashFlow: cash?.freeCashFlow,
          })
        : null;
      const indicated = indicatedAnnualDividend(null, profile?.lastDividend);
      const dividendYield =
        indicated != null && quote?.price && quote.price > 0 ? indicated / quote.price : null;
      return { symbol, quote, profile, ttm, cash, estimates, target, grades, live, margins, dividendYield, performance };
    }),
  );
}

export function compareChartFrom(span: CompareChartSpan) {
  const today = new Date(`${nyDateString()}T00:00:00Z`);
  switch (span) {
    case "1M":
      return isoDate(addDays(today, -50));
    case "3M":
      return isoDate(addDays(today, -120));
    case "6M":
      return isoDate(addDays(today, -220));
    case "YTD":
      return isoDate(addDays(new Date(`${today.getUTCFullYear()}-01-01T00:00:00Z`), -15));
    case "1Y":
      return isoDate(addDays(today, -400));
    case "3Y":
      return isoDate(addDays(today, -365 * 3 - 20));
    case "5Y":
      return isoDate(addDays(today, -365 * 5 - 20));
    case "10Y":
      return isoDate(addDays(today, -365 * 10 - 20));
    case "MAX":
      return "1970-01-01";
  }
}

/** Calendar start used by Average Return, so the chart window matches those rows. */
export function compareWindowStart(span: CompareChartSpan) {
  const today = new Date(`${nyDateString()}T00:00:00Z`);
  switch (span) {
    case "1M":
      return isoDate(addDays(today, -30));
    case "3M":
      return isoDate(addDays(today, -91));
    case "6M":
      return isoDate(addDays(today, -182));
    case "YTD":
      return `${today.getUTCFullYear()}-01-01`;
    case "1Y":
      return isoDate(addDays(today, -365));
    case "3Y":
      return isoDate(addDays(today, -365 * 3));
    case "5Y":
      return isoDate(addDays(today, -365 * 5));
    case "10Y":
      return isoDate(addDays(today, -365 * 10));
    case "MAX":
      return null;
  }
}

function sliceCompareWindow(
  points: { date: string; price: number }[],
  startFloor: string | null,
  end: string,
) {
  const upToEnd = points.filter((row) => row.date <= end);
  if (!startFloor) return upToEnd;
  const onOrBefore = [...upToEnd].reverse().find((row) => row.date <= startFloor);
  const after = upToEnd.filter((row) => row.date > startFloor);
  return onOrBefore ? [onOrBefore, ...after] : after;
}

export function normalizePriceSeries(rows: { date: string; price: number }[], startDate?: string): ChartPoint[] {
  const sorted = [...rows].filter((row) => row.price > 0).sort((a, b) => a.date.localeCompare(b.date));
  const sliced = startDate ? sorted.filter((row) => row.date >= startDate) : sorted;
  const first = sliced[0]?.price;
  if (!first) return [];
  return sliced.map((row) => ({ time: row.date, value: (row.price / first) * 100 }));
}

export async function getNormalizedCompareSeries(symbols: string[], span: CompareChartSpan = "1Y") {
  const from = compareChartFrom(span);
  const startFloor = compareWindowStart(span);
  const raw = await Promise.all(
    symbols.map(async (symbol) => {
      const candles = await getDividendAdjustedChart(symbol, from);
      const points = [...candles]
        .filter((row) => typeof row.adjClose === "number" && row.adjClose > 0)
        .sort((a, b) => a.date.localeCompare(b.date))
        .map((row) => ({ date: row.date, price: row.adjClose }));
      return { symbol, points };
    }),
  );
  const end = raw
    .map((row) => row.points.at(-1)?.date)
    .filter((date): date is string => Boolean(date))
    .sort()[0];
  if (!end) {
    return symbols.map((symbol) => ({ symbol, points: [] as ChartPoint[] }));
  }
  const windowed = raw.map((row) => ({
    symbol: row.symbol,
    points: sliceCompareWindow(row.points, startFloor, end),
  }));
  const start = windowed
    .map((row) => row.points[0]?.date)
    .filter((date): date is string => Boolean(date))
    .sort()
    .at(-1);
  return windowed.map((row) => ({
    symbol: row.symbol,
    points: downsampleChartPoints(normalizePriceSeries(row.points, start)),
  }));
}
