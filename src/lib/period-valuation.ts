import { yearOverYear } from "@/lib/format";
import { getBalanceSheets, getCashFlows, getCashFlowTtm, getDailyChart, getIncomeStatements, getIncomeTtm, getQuote } from "@/lib/fmp";
import { closeOnOrBefore, toCloseSeries } from "@/lib/fundamental-chart";
import { derivedBalanceMetrics, derivedEfficiencyMetrics, derivedQualityMetrics, derivedStatementMetrics } from "@/lib/statements";
import type { StatementPeriod } from "@/lib/types";
import { addDays, cashAndInvestments, isoDate, nyDateString } from "@/lib/utils";
import { altmanZScore, derivedValuationMetrics, marketCapFromPrice } from "@/lib/valuation";

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
  shares?: number | null;
  income?: Record<string, unknown> | null;
  cash?: Record<string, unknown> | null;
  balance?: Record<string, unknown> | null;
  priorBalance?: Record<string, unknown> | null;
  nextEps?: number | null;
  sharesYoy?: number | null;
  epsCagr?: number | null;
  daysInPeriod?: number;
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
  const shares =
    finite(input.shares) ?? finite(mergedIncome.weightedAverageShsOutDil) ?? finite(income.weightedAverageShsOut);
  const balance: Record<string, unknown> = {
    ...mergedIncome,
    ...(input.balance ?? {}),
  };
  const derivedBalance = derivedBalanceMetrics({
    ...balance,
    weightedAverageShsOutDil: shares ?? finite(balance.weightedAverageShsOutDil),
  });
  const price = finite(input.price);
  const efficiency = derivedEfficiencyMetrics({
    income: { ...mergedIncome, ebit: derivedIncome.ebit, ebitda: derivedIncome.ebitda },
    balance,
    priorBalance: input.priorBalance,
    daysInPeriod: input.daysInPeriod,
  });
  const marketCap = finite(input.marketCap) ?? marketCapFromPrice(price, shares);
  const derived = derivedValuationMetrics({
    price,
    marketCap,
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
  const quality = derivedQualityMetrics({
    income: { ...mergedIncome, ebit: derivedIncome.ebit, ebitda: derivedIncome.ebitda },
    cash,
    balance,
    shares,
    bookPerShare: derivedBalance.bookValuePerShare,
    daysOfSalesOutstanding: efficiency.daysOfSalesOutstanding,
    daysOfInventoryOutstanding: efficiency.daysOfInventoryOutstanding,
  });
  return {
    ...derived,
    ...efficiency,
    ...quality,
    workingCapital: derivedBalance.workingCapital,
    bookValuePerShare: derivedBalance.bookValuePerShare,
    tangibleBookValue: derivedBalance.tangibleBookValue,
    tangibleBookValuePerShare: derivedBalance.tangibleBookValuePerShare,
    totalDebt: finite(balance.totalDebt),
    netCash: derivedBalance.netCashPosition,
    cashAndInvestments: cashAndInvestments({
      cashAndShortTermInvestments: finite(balance.cashAndShortTermInvestments) ?? undefined,
      longTermInvestments: finite(balance.longTermInvestments) ?? undefined,
    }),
    eps: finite(mergedIncome.epsDiluted) ?? finite(mergedIncome.eps),
    ebit: derivedIncome.ebit,
    ebitda: derivedIncome.ebitda,
    altmanZScore: altmanZScore({
      marketCap,
      workingCapital: derivedBalance.workingCapital,
      totalAssets: finite(balance.totalAssets),
      retainedEarnings: finite(balance.retainedEarnings),
      ebit: derivedIncome.ebit,
      totalLiabilities: finite(balance.totalLiabilities),
      revenue: finite(mergedIncome.revenue),
    }),
  };
}

export type PeriodValuationRow = {
  date: string;
  fiscalYear?: string | number;
  period?: string;
} & ReturnType<typeof valuationFromFilings>;

/** Daily closes covering `limit` filings, not a 1970 MAX chart. */
export function priceFromForFilings(period: StatementPeriod, limit: number) {
  const years = period === "quarter" ? Math.ceil(limit / 4) + 2 : limit + 2;
  return isoDate(addDays(new Date(`${nyDateString()}T00:00:00Z`), -365 * Math.max(years, 3)));
}

export async function loadPeriodValuationHistory(symbol: string, period: StatementPeriod, limit = 20) {
  const priorOffset = period === "quarter" ? 4 : 1;
  const priceFrom = priceFromForFilings(period, limit);
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
    const priorPeriod = income[index + 1];
    const priorBalance = priorPeriod
      ? matchStatement(balance, priorPeriod.date, priorPeriod.fiscalYear)
      : null;
    const price = closeOnOrBefore(closes, row.date);
    return {
      date: row.date,
      fiscalYear: row.fiscalYear,
      period: row.period,
      reportedCurrency: row.reportedCurrency,
      ...valuationFromFilings({
        price,
        income: row as unknown as Record<string, unknown>,
        cash: cashRow as unknown as Record<string, unknown> | null,
        balance: balanceRow as unknown as Record<string, unknown> | null,
        priorBalance: priorBalance as unknown as Record<string, unknown> | null,
        daysInPeriod: period === "quarter" ? 365 / 4 : 365,
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
    getBalanceSheets(symbol, "quarter", 5),
  ]);
  return valuationFromFilings({
    price: quote?.price,
    marketCap: quote?.marketCap,
    income: income as unknown as Record<string, unknown> | null,
    cash: cash as unknown as Record<string, unknown> | null,
    balance: (sheets[0] ?? null) as unknown as Record<string, unknown> | null,
    priorBalance: (sheets[4] ?? sheets[1] ?? null) as unknown as Record<string, unknown> | null,
    daysInPeriod: 365,
  });
}

export function historyLabel(
  row: { date: string; fiscalYear?: string | number; period?: string },
  period: StatementPeriod,
) {
  if (period === "quarter" && row.period) return `${row.period} ${row.fiscalYear ?? row.date.slice(0, 4)}`;
  return String(row.fiscalYear ?? row.date.slice(0, 4));
}

export function periodValuationColumns(rows: PeriodValuationRow[], period: StatementPeriod) {
  return rows.map((row) => ({
    key: `${row.date}-${row.period ?? period}`,
    label: historyLabel(row, period),
    values: row as unknown as Record<string, unknown>,
  }));
}
