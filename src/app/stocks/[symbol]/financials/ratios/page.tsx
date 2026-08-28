import { Container } from "@/components/container";
import { FinancialsNav } from "@/components/financials-nav";
import { PageHeader, PeriodToggle, YearToggle } from "@/components/page-header";
import { StatementTable } from "@/components/statement-table";
import {
  getBalanceSheets,
  getCashFlows,
  getCashFlowTtm,
  getDailyChart,
  getEnterpriseValues,
  getEstimates,
  getIncomeStatements,
  getIncomeTtm,
  getKeyMetrics,
  getKeyMetricsTtm,
  getQuote,
  getRatios,
  getRatiosTtm,
  getYearAgoMarketCap,
} from "@/lib/fmp";
import { closeOnOrBefore, toCloseSeries } from "@/lib/fundamental-chart";
import { yearOverYear } from "@/lib/format";
import { decodeTicker, stockPath } from "@/lib/listings";
import {
  RATIO_SECTIONS,
  derivedBalanceMetrics,
  derivedStatementMetrics,
  mergeStatementValues,
  spanFrom,
  statementHref,
  statementLimit,
  stripTtmSuffix,
  toStatementColumns,
  withAdjacentGrowth,
  withStatementHrefs,
} from "@/lib/statements";
import type { FmpBalanceSheet, FmpCashFlow, FmpEnterpriseValue, FmpIncomeStatement, StatementPeriod } from "@/lib/types";
import { addDays, isoDate, nyDateString, relativeChange } from "@/lib/utils";
import {
  actualToEstimateCagr,
  assignFinite,
  derivedValuationMetrics,
  estimateCagr,
  marketCapFromPrice,
  nextEstimate,
} from "@/lib/valuation";

type StatementColumn = { key: string; label: string; values: Record<string, unknown> };

const METRIC_KEYS = [
  "marketCap",
  "enterpriseValue",
  "evToSales",
  "evToEBITDA",
  "evToEBIT",
  "evToFreeCashFlow",
  "evToEarnings",
  "returnOnAssets",
  "returnOnEquity",
  "returnOnInvestedCapital",
  "returnOnCapitalEmployed",
  "earningsYield",
  "freeCashFlowYield",
  "netDebtToEBITDA",
  "currentRatio",
];

function num(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function matchRow<T extends { date?: string; fiscalYear?: string }>(
  rows: T[],
  column: StatementColumn,
  period: StatementPeriod,
) {
  const date = typeof column.values.date === "string" ? column.values.date : "";
  const year = column.values.fiscalYear;
  if (period === "annual" && year != null) {
    return (
      rows.find((row) => row.date === date) ??
      rows.find((row) => String(row.fiscalYear) === String(year)) ??
      null
    );
  }
  return rows.find((row) => row.date === date) ?? null;
}

function matchEnterprise(rows: FmpEnterpriseValue[], column: StatementColumn) {
  const date = typeof column.values.date === "string" ? column.values.date : "";
  return rows.find((row) => row.date === date) ?? null;
}

function overlayRatioColumn(
  column: StatementColumn,
  input: {
    income?: FmpIncomeStatement | Record<string, unknown> | null;
    balance?: FmpBalanceSheet | Record<string, unknown> | null;
    cash?: FmpCashFlow | Record<string, unknown> | null;
    enterprise?: FmpEnterpriseValue | null;
    price?: number | null;
    marketCap?: number | null;
    nextEps?: number | null;
    epsCagr?: number | null;
    sharesYoy?: number | null;
    date?: string | null;
  },
): StatementColumn {
  const income: Record<string, unknown> = {
    ...column.values,
    ...((input.income as Record<string, unknown> | null | undefined) ?? {}),
  };
  const cash: Record<string, unknown> = (input.cash as Record<string, unknown> | undefined) ?? {};
  const mergedIncome: Record<string, unknown> = {
    ...income,
    depreciationAndAmortization:
      num(income.depreciationAndAmortization) ?? num(cash.depreciationAndAmortization),
    freeCashFlow: num(income.freeCashFlow) ?? num(cash.freeCashFlow),
    operatingCashFlow:
      num(income.operatingCashFlow) ??
      num(cash.operatingCashFlow) ??
      num(cash.netCashProvidedByOperatingActivities),
  };
  const derivedIncome = derivedStatementMetrics(mergedIncome);
  const balance: Record<string, unknown> = {
    ...mergedIncome,
    ...((input.balance as Record<string, unknown> | null | undefined) ?? {}),
  };
  const derivedBalance = derivedBalanceMetrics({
    ...balance,
    weightedAverageShsOutDil:
      num(balance.weightedAverageShsOutDil) ?? num(mergedIncome.weightedAverageShsOutDil),
  });
  const overlay = derivedValuationMetrics({
    price: input.price ?? num(input.enterprise?.stockPrice),
    marketCap:
      input.marketCap ?? num(input.enterprise?.marketCapitalization) ?? num(mergedIncome.marketCap),
    equity: num(balance.totalStockholdersEquity),
    tangibleEquity: derivedBalance.tangibleBookValue,
    bookPerShare: derivedBalance.bookValuePerShare,
    tangibleBookPerShare: derivedBalance.tangibleBookValuePerShare,
    totalDebt: num(balance.totalDebt),
    netCash: derivedBalance.netCashPosition,
    revenue: num(mergedIncome.revenue),
    eps: num(mergedIncome.epsDiluted) ?? num(mergedIncome.eps),
    ebit: derivedIncome.ebit,
    ebitda: derivedIncome.ebitda,
    fcf: num(mergedIncome.freeCashFlow),
    ocf: num(mergedIncome.operatingCashFlow),
    netIncome: num(mergedIncome.netIncome),
    sharesYoy: input.sharesYoy,
    dividendYield: num(column.values.dividendYield) ?? num(mergedIncome.dividendYield),
    nextEps: input.nextEps,
    epsCagr: input.epsCagr,
  });
  return {
    ...column,
    values: assignFinite(
      {
        ...column.values,
        ...mergedIncome,
        weightedAverageShsOutDil: num(mergedIncome.weightedAverageShsOutDil),
        ...(input.date ? { date: input.date } : {}),
      },
      overlay,
    ),
  };
}

export default async function RatiosPage({
  params,
  searchParams,
}: {
  params: Promise<{ symbol: string }>;
  searchParams: Promise<{ period?: string; years?: string }>;
}) {
  const { symbol } = await params;
  const { period: periodParam, years: yearsParam } = await searchParams;
  const ticker = decodeTicker(symbol);
  const period: StatementPeriod = periodParam === "quarter" ? "quarter" : "annual";
  const span = spanFrom(yearsParam);
  const displayCount = statementLimit(period, span);
  const priceFrom = isoDate(addDays(new Date(`${nyDateString()}T00:00:00Z`), period === "quarter" ? -365 * 12 : -365 * 22));
  const [
    rows,
    ttm,
    metrics,
    metricsTtm,
    incomeTtm,
    incomeRows,
    annualIncome,
    balanceRows,
    quarterSheets,
    cashRows,
    cashTtm,
    estimates,
    quote,
    enterpriseRows,
    yearAgoCap,
    dailyCloses,
  ] = await Promise.all([
    getRatios(ticker, period, displayCount),
    getRatiosTtm(ticker),
    getKeyMetrics(ticker, period, displayCount),
    getKeyMetricsTtm(ticker),
    getIncomeTtm(ticker),
    getIncomeStatements(ticker, period, displayCount + (period === "quarter" ? 4 : 1)),
    period === "annual" ? Promise.resolve([] as FmpIncomeStatement[]) : getIncomeStatements(ticker, "annual", 2),
    getBalanceSheets(ticker, period, displayCount + 1),
    period === "annual" ? getBalanceSheets(ticker, "quarter", 1) : Promise.resolve([] as FmpBalanceSheet[]),
    getCashFlows(ticker, period, displayCount + 1),
    getCashFlowTtm(ticker),
    getEstimates(ticker, "annual"),
    getQuote(ticker),
    getEnterpriseValues(ticker, period, displayCount + 1),
    getYearAgoMarketCap(ticker),
    getDailyChart(ticker, priceFrom),
  ]);
  const periodCloses = toCloseSeries(dailyCloses);
  const latestAnnual = (annualIncome[0] ?? (period === "annual" ? incomeRows[0] : null)) ?? null;
  const priorAnnual = (annualIncome[1] ?? (period === "annual" ? incomeRows[1] : null)) ?? null;
  const annualShareYoy = relativeChange(
    latestAnnual?.weightedAverageShsOutDil,
    priorAnnual?.weightedAverageShsOutDil,
  );
  const epsCagr =
    actualToEstimateCagr(
      latestAnnual?.epsDiluted ?? latestAnnual?.eps,
      latestAnnual?.date,
      estimates,
      "epsAvg",
      3,
    ) ?? estimateCagr(estimates, "epsAvg", 3);
  const latestSheet = (period === "annual" ? quarterSheets[0] : balanceRows[0]) ?? null;
  const currentIncome = incomeTtm
    ? {
        ...(incomeTtm as unknown as Record<string, unknown>),
        depreciationAndAmortization:
          (incomeTtm as unknown as Record<string, unknown>).depreciationAndAmortization ??
          cashTtm?.depreciationAndAmortization,
        freeCashFlow: cashTtm?.freeCashFlow,
        operatingCashFlow: cashTtm?.operatingCashFlow ?? cashTtm?.netCashProvidedByOperatingActivities,
      }
    : null;

  let columns: StatementColumn[] = [
    {
      key: "ttm",
      label: "Current",
      values: {
        ...stripTtmSuffix(metricsTtm as Record<string, unknown> | null),
        ...stripTtmSuffix(ttm as Record<string, unknown> | null),
        date: nyDateString(),
      },
    },
    ...toStatementColumns(rows, period),
  ];
  columns = mergeStatementValues(columns, metrics, METRIC_KEYS, period === "annual" ? "fiscalYear" : "date");
  columns = columns.map((column) => {
    const isCurrent = column.key === "ttm";
    const income = isCurrent ? null : matchRow(incomeRows, column, period);
    const incomeIndex = income ? incomeRows.findIndex((row) => row.date === income.date) : -1;
    const priorIncome = incomeIndex >= 0 ? incomeRows[incomeIndex + 1] ?? null : null;
    const priorPegIncome = incomeIndex >= 0 ? incomeRows[incomeIndex + (period === "quarter" ? 4 : 1)] ?? null : null;
    const enterprise = isCurrent ? null : matchEnterprise(enterpriseRows, column);
    const periodDate = isCurrent
      ? null
      : typeof column.values.date === "string"
        ? column.values.date
        : income?.date;
    const periodPrice = isCurrent
      ? quote?.price
      : (closeOnOrBefore(periodCloses, periodDate) ?? num(enterprise?.stockPrice));
    const shares = isCurrent
      ? null
      : num(income?.weightedAverageShsOutDil) ?? num(enterprise?.numberOfShares);
    return overlayRatioColumn(column, {
      income: isCurrent ? currentIncome : income,
      balance: isCurrent ? latestSheet : matchRow(balanceRows, column, period),
      cash: isCurrent ? cashTtm : matchRow(cashRows, column, period),
      enterprise,
      price: periodPrice,
      marketCap: isCurrent
        ? quote?.marketCap
        : (marketCapFromPrice(periodPrice, shares) ?? num(enterprise?.marketCapitalization)),
      nextEps: isCurrent ? nextEstimate(estimates)?.epsAvg : null,
      epsCagr: isCurrent
        ? epsCagr
        : yearOverYear(income?.epsDiluted ?? income?.eps, priorPegIncome?.epsDiluted ?? priorPegIncome?.eps),
      sharesYoy: isCurrent
        ? annualShareYoy
        : yearOverYear(income?.weightedAverageShsOutDil, priorIncome?.weightedAverageShsOutDil),
      date: isCurrent ? nyDateString() : undefined,
    });
  });
  columns = columns.map((column) => {
    if (column.key === "ttm") return column;
    const values = { ...column.values };
    delete values.forwardPe;
    return { ...column, values };
  });
  columns = withAdjacentGrowth(
    columns,
    "marketCap",
    "marketCapGrowth",
    1,
    relativeChange(quote?.marketCap, yearAgoCap?.marketCap),
  );
  const base = stockPath(ticker, "/financials/ratios");

  return (
    <Container>
      <PageHeader
        title={`${ticker} Financial Ratios`}
        description="Market cap in millions. The Current column uses live price, trailing income and cash flow, and the latest balance sheet. Fiscal columns use the last FMP close on or before each period end, times diluted shares. Forward PE is Current only. Historical PEG is period-end PE divided by year-over-year EPS growth."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <PeriodToggle
              period={period}
              annualHref={statementHref(base, "annual", "standardized", span)}
              quarterHref={statementHref(base, "quarter", "standardized", span)}
            />
            <YearToggle
              span={span}
              fiveHref={statementHref(base, period, "standardized", "5")}
              tenHref={statementHref(base, period, "standardized", "10")}
              maxHref={statementHref(base, period, "standardized", "max")}
            />
          </div>
        }
      />
      <FinancialsNav symbol={ticker} />
      <div className="flex flex-col gap-10">
        {RATIO_SECTIONS.map((section) => (
          <section key={section.id}>
            <h2 className="mb-3 font-semibold text-header">{section.title}</h2>
            <StatementTable
              rows={withStatementHrefs(section.rows, ticker)}
              columns={columns}
              scale={section.scale}
              inlineYoy={section.inlineYoy ?? false}
              downloadName={`${ticker}-ratios-${section.id}-${period}-${span}`}
              cornerLabel="Fiscal Year"
            />
          </section>
        ))}
      </div>
    </Container>
  );
}
