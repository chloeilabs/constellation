import { yearOverYear } from "@/lib/format";
import { dividendsByFiscalYear } from "@/lib/dividends";
import { derivedStatementMetrics } from "@/lib/statements";
import type {
  FmpCashFlow,
  FmpDividend,
  FmpEstimate,
  FmpGrade,
  FmpGradesConsensus,
  FmpHistoricalGrade,
  FmpIncomeStatement,
  FmpPriceTargetNews,
  StatementPeriod,
} from "@/lib/types";

export type ForecastColumn = {
  key: string;
  label: string;
  values: Record<string, unknown>;
};

export type ForecastRangeYear = {
  key: string;
  label: string;
  revenueLow: number | null;
  revenueAvg: number | null;
  revenueHigh: number | null;
  revenueGrowthLow: number | null;
  revenueGrowthAvg: number | null;
  revenueGrowthHigh: number | null;
  epsLow: number | null;
  epsAvg: number | null;
  epsHigh: number | null;
  epsGrowthLow: number | null;
  epsGrowthAvg: number | null;
  epsGrowthHigh: number | null;
};

export type ForecastHeadline = {
  label: string;
  revenue: number | null;
  revenueFrom: number | null;
  revenueGrowth: number | null;
  eps: number | null;
  epsFrom: number | null;
  epsGrowth: number | null;
};

function periodKey(date: string) {
  return date.slice(0, 7);
}

function num(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function chrono<T extends { date?: string }>(rows: T[]) {
  return [...rows].filter((row) => row.date).sort((a, b) => String(a.date).localeCompare(String(b.date)));
}

function analystCount(row: FmpEstimate) {
  const revenue = num(row.numAnalystsRevenue);
  const eps = num(row.numAnalystsEps);
  if (revenue == null && eps == null) return null;
  return Math.max(revenue ?? 0, eps ?? 0) || null;
}

function inferAnnualYear(date: string, actuals: FmpIncomeStatement[]) {
  const last = chrono(actuals).at(-1);
  if (!last?.date || last.fiscalYear == null) return date.slice(0, 4);
  const elapsed = (Date.parse(date) - Date.parse(last.date)) / (365.25 * 86400000);
  const years = Math.max(1, Math.round(elapsed) || 1);
  const base = Number(last.fiscalYear);
  return Number.isFinite(base) ? String(base + years) : date.slice(0, 4);
}

function inferQuarterLabel(date: string, actuals: FmpIncomeStatement[]) {
  const quarters = chrono(actuals).filter((row) => /^Q[1-4]$/i.test(String(row.period)));
  const last = quarters.at(-1);
  if (!last?.date) return { period: "", fiscalYear: date.slice(0, 4), label: date.slice(0, 7) };
  const steps = Math.max(1, Math.round((Date.parse(date) - Date.parse(last.date)) / (91.25 * 86400000)));
  let quarter = Number(String(last.period).replace(/^Q/i, ""));
  let year = Number(last.fiscalYear);
  if (!Number.isFinite(quarter) || !Number.isFinite(year)) {
    return { period: "", fiscalYear: date.slice(0, 4), label: date.slice(0, 7) };
  }
  for (let i = 0; i < steps; i += 1) {
    quarter += 1;
    if (quarter > 4) {
      quarter = 1;
      year += 1;
    }
  }
  return { period: `Q${quarter}`, fiscalYear: String(year), label: `Q${quarter} ${year}` };
}

function cashByPeriod(rows: FmpCashFlow[]) {
  const byKey = new Map<string, FmpCashFlow>();
  for (const row of chrono(rows)) byKey.set(periodKey(row.date), row);
  return byKey;
}

function dividendsThrough(
  dividends: FmpDividend[],
  startExclusive: string | null,
  endInclusive: string,
) {
  let total = 0;
  let count = 0;
  for (const row of dividends) {
    if (!row.date || row.date > endInclusive) continue;
    if (startExclusive && row.date <= startExclusive) continue;
    const amount = row.adjDividend || row.dividend || 0;
    if (!Number.isFinite(amount)) continue;
    total += amount;
    count += 1;
  }
  return count > 0 ? total : null;
}

function actualValues(
  row: FmpIncomeStatement,
  cash: FmpCashFlow | undefined,
  dps: number | null,
  price: number | null,
  showForwardPe: boolean,
): Record<string, unknown> {
  const derived = derivedStatementMetrics(row as unknown as Record<string, unknown>);
  const revenue = num(row.revenue);
  const eps = num(row.epsDiluted) ?? num(row.eps);
  const fcf = num(cash?.freeCashFlow);
  return {
    date: row.date,
    fiscalYear: row.fiscalYear,
    period: row.period,
    isEstimate: false,
    revenue,
    grossProfit: num(row.grossProfit),
    grossProfitMargin: derived.grossProfitMargin,
    operatingIncome: num(row.operatingIncome),
    netIncome: num(row.netIncome),
    eps,
    forwardPe: showForwardPe && price != null && eps && eps > 0 ? price / eps : null,
    dividendPerShare: dps,
    freeCashFlow: fcf,
    analysts: null,
  };
}

function estimateValues(row: FmpEstimate, price: number | null, showForwardPe: boolean): Record<string, unknown> {
  const revenue = num(row.revenueAvg);
  const eps = num(row.epsAvg);
  const operating = num(row.ebitAvg);
  const net = num(row.netIncomeAvg);
  return {
    date: row.date,
    isEstimate: true,
    revenue,
    grossProfit: null,
    grossProfitMargin: null,
    operatingIncome: operating,
    netIncome: net,
    eps,
    forwardPe: showForwardPe && price != null && eps && eps > 0 ? price / eps : null,
    dividendPerShare: null,
    freeCashFlow: null,
    analysts: analystCount(row),
  };
}

function withGrowth(columns: ForecastColumn[], prior: ForecastColumn | null) {
  return columns.map((column, index) => {
    const previous = index === 0 ? prior : columns[index - 1];
    const revenueGrowth = yearOverYear(column.values.revenue, previous?.values.revenue);
    const epsGrowth = yearOverYear(column.values.eps, previous?.values.eps);
    const dividendGrowth = yearOverYear(column.values.dividendPerShare, previous?.values.dividendPerShare);
    return {
      ...column,
      values: {
        ...column.values,
        revenueGrowth,
        epsGrowth,
        dividendGrowth,
      },
    };
  });
}

export function buildForecastColumns({
  period,
  actuals,
  estimates,
  cashFlows,
  dividends,
  price,
  actualCount = period === "quarter" ? 4 : 5,
  estimateCount = period === "quarter" ? 4 : 3,
}: {
  period: StatementPeriod;
  actuals: FmpIncomeStatement[];
  estimates: FmpEstimate[];
  cashFlows: FmpCashFlow[];
  dividends: FmpDividend[];
  price?: number | null;
  actualCount?: number;
  estimateCount?: number;
}): ForecastColumn[] {
  const actualChrono = chrono(actuals);
  const estimateChrono = chrono(estimates);
  const lastActualDate = actualChrono.at(-1)?.date ?? "";
  const cash = cashByPeriod(cashFlows);
  const futureEstimates = estimateChrono.filter((row) => (lastActualDate ? row.date > lastActualDate : true));
  const displayedActuals = actualChrono.slice(-actualCount);
  const priorActual = actualChrono[actualChrono.length - actualCount - 1] ?? null;
  const displayedEstimates = futureEstimates.slice(0, estimateCount);
  const dpsByYear =
    period === "annual" ? dividendsByFiscalYear(dividends, actualChrono) : null;
  const px = price ?? null;
  const showForwardPe = period === "annual";

  const toActualColumn = (row: FmpIncomeStatement, previousDate: string | null): ForecastColumn => {
    const fy = String(row.fiscalYear);
    const dps =
      period === "annual"
        ? (dpsByYear?.get(fy) ?? null)
        : dividendsThrough(dividends, previousDate, row.date);
    return {
      key: `${row.date}-actual`,
      label: period === "quarter" ? `${row.period} ${row.fiscalYear}` : `FY ${row.fiscalYear}`,
      values: actualValues(row, cash.get(periodKey(row.date)), dps, px, showForwardPe),
    };
  };

  const priorColumn = priorActual ? toActualColumn(priorActual, null) : null;
  const actualColumns = displayedActuals.map((row, index) => {
    const previousDate = (index === 0 ? priorActual?.date : displayedActuals[index - 1]?.date) ?? null;
    return toActualColumn(row, previousDate);
  });

  const estimateColumns = displayedEstimates.map((row) => {
    const annualYear = inferAnnualYear(row.date, actualChrono);
    const quarter = period === "quarter" ? inferQuarterLabel(row.date, actualChrono) : null;
    const values = estimateValues(row, px, showForwardPe);
    if (period === "annual") {
      values.fiscalYear = annualYear;
      values.period = "FY";
    } else if (quarter) {
      values.fiscalYear = quarter.fiscalYear;
      values.period = quarter.period;
    }
    return {
      key: `${row.date}-estimate`,
      label: period === "quarter" ? (quarter?.label ?? row.date) : `FY ${annualYear}`,
      values,
    };
  });

  return withGrowth([...actualColumns, ...estimateColumns], priorColumn);
}

export function forecastHeadlines(columns: ForecastColumn[]): {
  thisYear: ForecastHeadline | null;
  nextYear: ForecastHeadline | null;
} {
  const lastActual = [...columns].reverse().find((column) => column.values.isEstimate !== true) ?? null;
  const estimates = columns.filter((column) => column.values.isEstimate === true);
  const thisYear = estimates[0] ?? null;
  const nextYear = estimates[1] ?? null;
  const headline = (
    column: ForecastColumn | null,
    fromColumn: ForecastColumn | null,
    fallbackLabel: string,
  ): ForecastHeadline | null => {
    if (!column) return null;
    return {
      label: column.label || fallbackLabel,
      revenue: num(column.values.revenue),
      revenueFrom: num(fromColumn?.values.revenue),
      revenueGrowth: num(column.values.revenueGrowth),
      eps: num(column.values.eps),
      epsFrom: num(fromColumn?.values.eps),
      epsGrowth: num(column.values.epsGrowth),
    };
  };
  return {
    thisYear: headline(thisYear, lastActual, "This Year"),
    nextYear: headline(nextYear, thisYear, "Next Year"),
  };
}

export function forecastRanges(
  estimates: FmpEstimate[],
  actuals: FmpIncomeStatement[],
  columns: ForecastColumn[],
  years = 3,
): ForecastRangeYear[] {
  const lastActualDate = chrono(actuals).at(-1)?.date ?? "";
  const lastActual = [...columns].reverse().find((column) => column.values.isEstimate !== true) ?? null;
  const lastActualRevenue = num(lastActual?.values.revenue);
  const lastActualEps = num(lastActual?.values.eps);
  const future = chrono(estimates)
    .filter((row) => (lastActualDate ? row.date > lastActualDate : true))
    .slice(0, years);

  return future.map((row, index) => {
    const previous = index === 0 ? null : future[index - 1];
    const baseRevenue = index === 0 ? lastActualRevenue : num(previous?.revenueAvg);
    const baseEps = index === 0 ? lastActualEps : num(previous?.epsAvg);
    const year = String(columns.find((column) => column.values.date === row.date)?.label ?? row.date.slice(0, 4)).replace(/^FY\s/, "");
    return {
      key: row.date,
      label: year,
      revenueLow: num(row.revenueLow),
      revenueAvg: num(row.revenueAvg),
      revenueHigh: num(row.revenueHigh),
      revenueGrowthLow: yearOverYear(row.revenueLow, baseRevenue),
      revenueGrowthAvg: yearOverYear(row.revenueAvg, baseRevenue),
      revenueGrowthHigh: yearOverYear(row.revenueHigh, baseRevenue),
      epsLow: num(row.epsLow),
      epsAvg: num(row.epsAvg),
      epsHigh: num(row.epsHigh),
      epsGrowthLow: yearOverYear(row.epsLow, baseEps),
      epsGrowthAvg: yearOverYear(row.epsAvg, baseEps),
      epsGrowthHigh: yearOverYear(row.epsHigh, baseEps),
    };
  });
}

export function recommendationTrend(rows: FmpHistoricalGrade[], months = 6) {
  return chrono(rows).slice(-months);
}

export function shortMonthLabel(date: string) {
  const stamp = Date.parse(`${date.slice(0, 10)}T00:00:00Z`);
  if (!Number.isFinite(stamp)) return date;
  const month = new Date(stamp).toLocaleDateString("en-US", { month: "short", timeZone: "UTC" });
  const year = String(new Date(stamp).getUTCFullYear()).slice(2);
  return `${month} '${year}`;
}

function normalizeFirm(value: string | null | undefined) {
  return (value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\b(and|co|company|llc|inc|securities|capital|research|partners)\b/g, "")
    .trim();
}

export function latestForecasts(grades: FmpGrade[], news: FmpPriceTargetNews[], limit = 12) {
  return grades.slice(0, limit).map((row) => {
    const date = row.date.slice(0, 10);
    const firm = normalizeFirm(row.gradingCompany);
    const match = news.find((item) => {
      if (item.publishedDate.slice(0, 10) !== date) return false;
      const publisher = normalizeFirm(item.analystCompany || item.newsPublisher);
      if (!firm || !publisher) return false;
      return firm.includes(publisher.slice(0, 8)) || publisher.includes(firm.slice(0, 8));
    });
    return {
      ...row,
      analystName: match?.analystName || null,
      priceTarget: match?.adjPriceTarget ?? match?.priceTarget ?? null,
      priceWhenPosted: match?.priceWhenPosted ?? null,
    };
  });
}

export function consensusAnalystCount(grades?: Pick<FmpGradesConsensus, "strongBuy" | "buy" | "hold" | "sell" | "strongSell"> | null) {
  if (!grades) return 0;
  return grades.strongBuy + grades.buy + grades.hold + grades.sell + grades.strongSell;
}

export function consensusMeaning(consensus?: string | null) {
  const value = (consensus || "").toLowerCase();
  if (!value) return null;
  if (value.includes("strong buy")) {
    return "analysts see substantial upside versus the market over the next twelve months";
  }
  if (value.includes("buy") || value.includes("outperform") || value.includes("overweight") || value.includes("accumulate")) {
    return "analysts believe this stock is likely to outperform the market over the next twelve months";
  }
  if (value.includes("hold") || value.includes("neutral") || value.includes("equal") || value.includes("market perform")) {
    return "analysts expect the stock to perform in line with the market over the next twelve months";
  }
  if (value.includes("sell") || value.includes("underperform") || value.includes("underweight") || value.includes("reduce")) {
    return "analysts believe this stock is likely to underperform the market over the next twelve months";
  }
  return null;
}
