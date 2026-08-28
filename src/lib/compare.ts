import {
  getCashFlowTtm,
  getDailyChart,
  getEstimates,
  getGradesConsensus,
  getIncomeTtm,
  getKeyMetricsTtm,
  getPriceChange,
  getPriceTarget,
  getProfile,
  getQuote,
  getRatiosTtm,
} from "@/lib/fmp";
import type { ChartPoint } from "@/lib/types";
import { addDays, isoDate, nyDateString } from "@/lib/utils";

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
      const [quote, profile, ttm, ratios, cash, metrics, changes, estimates, target, grades] = await Promise.all([
        getQuote(symbol),
        getProfile(symbol),
        getIncomeTtm(symbol),
        getRatiosTtm(symbol),
        getCashFlowTtm(symbol),
        getKeyMetricsTtm(symbol),
        getPriceChange(symbol),
        getEstimates(symbol, "annual"),
        getPriceTarget(symbol),
        getGradesConsensus(symbol),
      ]);
      return { symbol, quote, profile, ttm, ratios, cash, metrics, changes, estimates, target, grades };
    }),
  );
}

export type CompareChartSpan = "1Y" | "5Y";

export function compareChartSpan(value?: string): CompareChartSpan {
  return value === "5Y" ? "5Y" : "1Y";
}

export function compareChartFrom(span: CompareChartSpan) {
  const today = new Date(`${nyDateString()}T00:00:00Z`);
  return isoDate(addDays(today, span === "5Y" ? -365 * 5 - 20 : -400));
}

export function normalizePriceSeries(rows: { date: string; price: number }[], startDate?: string): ChartPoint[] {
  const sorted = [...rows].filter((row) => row.price > 0).sort((a, b) => a.date.localeCompare(b.date));
  const sliced = startDate ? sorted.filter((row) => row.date >= startDate) : sorted;
  const first = sliced[0]?.price;
  if (!first) return [];
  return sliced.map((row) => ({ time: row.date, value: (row.price / first) * 100 }));
}

export async function getNormalizedCompareSeries(symbols: string[], from: string) {
  const raw = await Promise.all(
    symbols.map(async (symbol) => {
      const candles = await getDailyChart(symbol, from);
      return {
        symbol,
        points: [...candles].filter((row) => row.price > 0).sort((a, b) => a.date.localeCompare(b.date)),
      };
    }),
  );
  const start = raw
    .map((row) => row.points[0]?.date)
    .filter((date): date is string => Boolean(date))
    .sort()
    .at(-1);
  return raw.map((row) => ({
    symbol: row.symbol,
    points: normalizePriceSeries(row.points, start),
  }));
}
