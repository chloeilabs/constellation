import { yearOverYear } from "@/lib/format";
import { getBalanceSheets, getCashFlows, getCashFlowTtm, getDailyChart, getIncomeStatements, getIncomeTtm, getQuote } from "@/lib/fmp";
import { closeOnOrBefore, toCloseSeries } from "@/lib/fundamental-chart";
import { derivedBalanceMetrics, derivedStatementMetrics } from "@/lib/statements";
import type { StatementPeriod } from "@/lib/types";
import { addDays, cashAndInvestments, isoDate, nyDateString } from "@/lib/utils";
import { derivedValuationMetrics, marketCapFromPrice } from "@/lib/valuation";

function finite(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function matchStatement<T extends { date?: string; fiscalYear?: string | number }>(
  rows: T[],
  date?: string | null,
  year?: string | number | null,
) {
  if (date) {
    const exact = rows.find((row) => row.date === date);
    if (exact) return exact;
  }
  if (year != null) {
    return rows.find((row) => String(row.fiscalYear) === String(year)) ?? null;
  }
  return null;
}

export function valuationFromFilings(input: {
  price?: number | null;
  marketCap?: number | null;
  income?: Record<string, unknown> | null;
  cash?: Record<string, unknown> | null;
  balance?: Record<string, unknown> | null;
  nextEps?: number | null;
  sharesYoy?: number | null;
  epsCagr?: number | null;
}) {
  const income = (input.income ?? {}) as Record<string, unknown>;
  const cash = (input.cash ?? {}) as Record<string, unknown>;
  const mergedIncome: Record<string, unknown> = {
    ...income,
    depreciationAndAmortization: finite(income.depreciationAndAmortization) ?? finite(cash.depreciationAndAmortization),
    freeCashFlow: finite(income.freeCashFlow) ?? finite(cash.freeCashFlow),
    operatingCashFlow:
      finite(income.operatingCashFlow) ??
      finite(cash.operatingCashFlow) ??
      finite(cash.netCashProvidedByOperatingActivities),
  };
  const derivedIncome = derivedStatementMetrics(mergedIncome);
  const balance: Record<string, unknown> = {
    ...mergedIncome,
    ...(input.balance ?? {}),
  };
  const derivedBalance = derivedBalanceMetrics({
    ...balance,
    weightedAverageShsOutDil: finite(balance.weightedAverageShsOutDil) ?? finite(mergedIncome.weightedAverageShsOutDil),
  });
  const price = finite(input.price);
  const shares = finite(mergedIncome.weightedAverageShsOutDil) ?? finite(balance.weightedAverageShsOutDil);
  const derived = derivedValuationMetrics({
    price,
    marketCap: finite(input.marketCap) ?? marketCapFromPrice(price, shares),
    equity: finite(balance.totalStockholdersEquity),
    tangibleEquity: derivedBalance.tangibleBookValue,
    bookPerShare: derivedBalance.bookValuePerShare,
    tangibleBookPerShare: derivedBalance.tangibleBookValuePerShare,
    totalDebt: finite(balance.totalDebt),
    netCash: derivedBalance.netCashPosition,
    revenue: finite(mergedIncome.revenue),
    eps: finite(mergedIncome.epsDiluted) ?? finite(mergedIncome.eps),
    ebit: derivedIncome.ebit,
    ebitda: derivedIncome.ebitda,
    fcf: finite(mergedIncome.freeCashFlow),
    ocf: finite(mergedIncome.operatingCashFlow),
    netIncome: finite(mergedIncome.netIncome),
    sharesYoy: input.sharesYoy,
    nextEps: input.nextEps,
    epsCagr: input.epsCagr,
  });
  return {
    ...derived,
    totalDebt: finite(balance.totalDebt),
    netCash: derivedBalance.netCashPosition,
    cashAndInvestments: cashAndInvestments({
      cashAndShortTermInvestments: finite(balance.cashAndShortTermInvestments) ?? undefined,
      longTermInvestments: finite(balance.longTermInvestments) ?? undefined,
    }),
    eps: finite(mergedIncome.epsDiluted) ?? finite(mergedIncome.eps),
  };
}

export type PeriodValuationRow = {
  date: string;
  fiscalYear?: string | number;
  period?: string;
} & ReturnType<typeof valuationFromFilings>;

export async function loadPeriodValuationHistory(symbol: string, period: StatementPeriod, limit = 20) {
  const lookbackYears = period === "quarter" ? 12 : 22;
  const priorOffset = period === "quarter" ? 4 : 1;
  const priceFrom = isoDate(addDays(new Date(`${nyDateString()}T00:00:00Z`), -365 * lookbackYears));
  const [income, cash, balance, candles] = await Promise.all([
    getIncomeStatements(symbol, period, limit + priorOffset),
    getCashFlows(symbol, period, limit + 1),
    getBalanceSheets(symbol, period, limit + 1),
    getDailyChart(symbol, priceFrom),
  ]);
  const closes = toCloseSeries(candles);
  return income.slice(0, limit).map((row, index) => {
    const cashRow = matchStatement(cash, row.date, row.fiscalYear);
    const balanceRow = matchStatement(balance, row.date, row.fiscalYear);
    const prior = income[index + priorOffset];
    const price = closeOnOrBefore(closes, row.date);
    return {
      date: row.date,
      fiscalYear: row.fiscalYear,
      period: row.period,
      ...valuationFromFilings({
        price,
        income: row as unknown as Record<string, unknown>,
        cash: cashRow as unknown as Record<string, unknown> | null,
        balance: balanceRow as unknown as Record<string, unknown> | null,
        epsCagr: yearOverYear(
          finite(row.epsDiluted) ?? finite(row.eps),
          finite(prior?.epsDiluted) ?? finite(prior?.eps),
        ),
      }),
    };
  });
}

export async function loadLiveValuation(symbol: string) {
  const [quote, income, cash, sheets] = await Promise.all([
    getQuote(symbol),
    getIncomeTtm(symbol),
    getCashFlowTtm(symbol),
    getBalanceSheets(symbol, "quarter", 1),
  ]);
  return valuationFromFilings({
    price: quote?.price,
    marketCap: quote?.marketCap,
    income: income as unknown as Record<string, unknown> | null,
    cash: cash as unknown as Record<string, unknown> | null,
    balance: (sheets[0] ?? null) as unknown as Record<string, unknown> | null,
  });
}

export function historyLabel(
  row: { date: string; fiscalYear?: string | number; period?: string },
  period: StatementPeriod,
) {
  if (period === "quarter" && row.period) return `${row.period} ${row.fiscalYear ?? row.date.slice(0, 4)}`;
  return String(row.fiscalYear ?? row.date.slice(0, 4));
}
