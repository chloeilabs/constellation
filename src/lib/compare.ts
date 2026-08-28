import {
  getBalanceSheets,
  getCashFlowTtm,
  getDailyChart,
  getEstimates,
  getGradesConsensus,
  getIncomeTtm,
  getPriceChange,
  getPriceTarget,
  getProfile,
  getQuote,
} from "@/lib/fmp";
import { valuationFromFilings } from "@/lib/period-valuation";
import { derivedStatementMetrics } from "@/lib/statements";
import type { ChartPoint } from "@/lib/types";
import { addDays, indicatedAnnualDividend, isoDate, nyDateString } from "@/lib/utils";
import { estimateCagr, nextEstimate } from "@/lib/valuation";

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
      const [quote, profile, ttm, cash, sheets, changes, estimates, target, grades] = await Promise.all([
        getQuote(symbol),
        getProfile(symbol),
        getIncomeTtm(symbol),
        getCashFlowTtm(symbol),
        getBalanceSheets(symbol, "quarter", 5),
        getPriceChange(symbol),
        getEstimates(symbol, "annual"),
        getPriceTarget(symbol),
        getGradesConsensus(symbol),
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
      return { symbol, quote, profile, ttm, cash, changes, estimates, target, grades, live, margins, dividendYield };
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
