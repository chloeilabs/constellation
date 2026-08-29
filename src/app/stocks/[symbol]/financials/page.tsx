import Link from "next/link";
import { Container } from "@/components/container";
import { FinancialsNav } from "@/components/financials-nav";
import { PageHeader, YearToggle } from "@/components/page-header";
import { HistoryBars } from "@/components/history-bars";
import { YearMetricTable, type YearMetricColumn } from "@/components/year-metric-table";
import { compactMoneyFn, reportingCurrency, yearOverYear } from "@/lib/format";
import {
  getBalanceSheets,
  getCashFlows,
  getCashFlowTtm,
  getDividends,
  getDailyChart,
  getEnterpriseValues,
  getEstimates,
  getIncomeStatements,
  getIncomeTtm,
  getQuote,
  getRevenueGeographicSegments,
  getRevenueProductSegments,
} from "@/lib/fmp";
import { closeOnOrBefore, toCloseSeries } from "@/lib/fundamental-chart";
import { decodeTicker, stockPath } from "@/lib/listings";
import {
  canonicalSegmentName,
  derivedStatementMetrics,
  priorTtmSegmentMap,
  segmentLevelValues,
  spanFrom,
  statementHref,
  statementLimit,
  trailingSum,
  ttmSegmentMap,
  withSegmentGrowth,
} from "@/lib/statements";
import { cashAndInvestments, indicatedAnnualDividend, netCashPosition, nyDateString } from "@/lib/utils";
import { DISTRIBUTION_HISTORY_LIMIT, dividendTtmGrowth, dividendsByFiscalYear } from "@/lib/dividends";
import { marketCapFromPrice, nextEstimate } from "@/lib/valuation";
import { valuationFromFilings, priceFromForFilings } from "@/lib/period-valuation";
import type { FmpBalanceSheet, FmpCashFlow, FmpEnterpriseValue, FmpIncomeStatement, FmpRevenueSegment } from "@/lib/types";

function n(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function fyLabel(year: string | number | undefined) {
  return year != null ? `FY ${year}` : "—";
}

function withEnded(column: YearMetricColumn, ended?: string | null): YearMetricColumn {
  return ended ? { ...column, ended } : column;
}

function incomeColumn(label: string, key: string, row: FmpIncomeStatement | null, prior: FmpIncomeStatement | null): YearMetricColumn {
  return {
    key,
    label,
    values: {
      revenue: n(row?.revenue),
      revenueGrowth: yearOverYear(row?.revenue, prior?.revenue),
      grossProfit: n(row?.grossProfit),
      grossProfitGrowth: yearOverYear(row?.grossProfit, prior?.grossProfit),
      operatingIncome: n(row?.operatingIncome),
      operatingIncomeGrowth: yearOverYear(row?.operatingIncome, prior?.operatingIncome),
      netIncome: n(row?.netIncome),
      netIncomeGrowth: yearOverYear(row?.netIncome, prior?.netIncome),
      eps: n(row?.epsDiluted ?? row?.eps),
      epsGrowth: yearOverYear(row?.epsDiluted ?? row?.eps, prior?.epsDiluted ?? prior?.eps),
    },
  };
}

function cashColumn(label: string, key: string, row: FmpCashFlow | null, prior: FmpCashFlow | null): YearMetricColumn {
  const ocf = n(row?.operatingCashFlow ?? row?.netCashProvidedByOperatingActivities);
  const priorOcf = n(prior?.operatingCashFlow ?? prior?.netCashProvidedByOperatingActivities);
  const capex = n(row?.capitalExpenditure);
  const priorCapex = n(prior?.capitalExpenditure);
  const fcf = n(row?.freeCashFlow);
  const priorFcf = n(prior?.freeCashFlow);
  return {
    key,
    label,
    values: {
      operatingCashFlow: ocf,
      ocfGrowth: yearOverYear(ocf, priorOcf),
      capex,
      capexGrowth: yearOverYear(capex, priorCapex),
      freeCashFlow: fcf,
      fcfGrowth: yearOverYear(fcf, priorFcf),
    },
  };
}

function balanceColumn(
  label: string,
  key: string,
  row: FmpBalanceSheet | null,
  prior: FmpBalanceSheet | null,
  shares: number | null,
  priorShares: number | null,
): YearMetricColumn {
  const cash = cashAndInvestments(row);
  const debt = n(row?.totalDebt);
  const priorCash = cashAndInvestments(prior);
  const priorDebt = n(prior?.totalDebt);
  const netCash = netCashPosition(row);
  const priorNet = netCashPosition(prior);
  const netCashPerShare = netCash != null && shares != null && shares > 0 ? netCash / shares : null;
  const priorNetPerShare =
    priorNet != null && priorShares != null && priorShares > 0 ? priorNet / priorShares : null;
  return {
    key,
    label,
    values: {
      cash,
      cashGrowth: yearOverYear(cash, priorCash),
      totalDebt: debt,
      debtGrowth: yearOverYear(debt, priorDebt),
      netCash,
      netCashGrowth: yearOverYear(netCash, priorNet),
      netCashPerShare,
      netCashPerShareGrowth: yearOverYear(netCashPerShare, priorNetPerShare),
    },
  };
}

function marginColumn(
  label: string,
  key: string,
  income: FmpIncomeStatement | null,
  cash: FmpCashFlow | null,
): YearMetricColumn {
  const derived = derivedStatementMetrics({
    ...((income as unknown as Record<string, unknown> | null) ?? {}),
    freeCashFlow: n(income?.freeCashFlow) ?? n(cash?.freeCashFlow),
  });
  return {
    key,
    label,
    values: {
      grossMargin: derived.grossProfitMargin,
      operatingMargin: derived.operatingProfitMargin,
      pretaxMargin: derived.pretaxProfitMargin,
      profitMargin: derived.netProfitMargin,
      fcfMargin: derived.fcfMargin,
    },
  };
}

function overlayValuationColumn(
  column: YearMetricColumn,
  input: {
    price?: number | null;
    marketCap?: number | null;
    income?: Record<string, unknown> | null;
    cash?: Record<string, unknown> | null;
    balance?: Record<string, unknown> | null;
    nextEps?: number | null;
  },
): YearMetricColumn {
  const derived = valuationFromFilings(input);
  const mapped: Record<string, number | null> = {
    price: derived.lastClosePrice,
    marketCap: derived.marketCap,
    enterpriseValue: derived.enterpriseValue,
    pe: derived.priceToEarningsRatio,
    forwardPe: derived.forwardPe,
    ps: derived.priceToSalesRatio,
    pb: derived.priceToBookRatio,
    pfcf: derived.priceToFreeCashFlowRatio,
    pocf: derived.priceToOperatingCashFlowRatio,
    evSales: derived.evToSales,
    evEbitda: derived.evToEBITDA,
    evEbit: derived.evToEBIT,
    evEarnings: derived.evToEarnings,
    evFcf: derived.evToFreeCashFlow,
    earningsYield: derived.earningsYield,
    fcfYield: derived.freeCashFlowYield,
  };
  const values = { ...column.values };
  for (const [key, value] of Object.entries(mapped)) {
    if (value != null) values[key] = value;
  }
  return { ...column, values };
}

function matchEnterprise(
  rows: FmpEnterpriseValue[],
  date?: string | null,
  fiscalYear?: string | number | null,
) {
  return (
    rows.find((row) => date && row.date === date) ??
    rows.find((row) => fiscalYear != null && row.date.slice(0, 4) === String(fiscalYear)) ??
    null
  );
}

function cleanSegmentName(name: string) {
  return canonicalSegmentName(name);
}

function segmentNames(rows: FmpRevenueSegment[], limit = 8) {
  const latest = rows[0]?.data;
  if (!latest) return [];
  return Object.entries(latest)
    .filter(([, value]) => typeof value === "number" && value > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([name]) => canonicalSegmentName(name));
}

function segmentLookup(rows: FmpRevenueSegment[]) {
  const byYear = new Map<string, { data: Record<string, number>; date: string }>();
  for (const row of rows) {
    const year = String(row.fiscalYear);
    const existing = byYear.get(year);
    const data = { ...(existing?.data ?? {}) };
    for (const [name, value] of Object.entries(row.data ?? {})) {
      if (typeof value !== "number" || !Number.isFinite(value)) continue;
      const key = canonicalSegmentName(name);
      data[key] = (data[key] ?? 0) + value;
    }
    const date = !existing || row.date > existing.date ? row.date : existing.date;
    byYear.set(year, { data, date });
  }
  return byYear;
}

function segmentTableRows(names: string[]) {
  return [
    ...names.flatMap((name) => [
      { key: name, label: cleanSegmentName(name), format: "money" as const },
      { key: `${name}Growth`, label: `${cleanSegmentName(name)} Growth`, format: "percent" as const },
    ]),
    { key: "total", label: "Revenue (Total)", format: "money" as const, emphasize: true },
    { key: "totalGrowth", label: "Revenue (Total) Growth", format: "percent" as const },
  ];
}

function segmentColumns(
  rows: FmpRevenueSegment[],
  names: string[],
  ttm?: Record<string, number> | null,
  priorTtm?: Record<string, number> | null,
  ttmDate?: string | null,
  yearCount = 5,
): YearMetricColumn[] {
  const byYear = segmentLookup(rows);
  const allYears = [...byYear.keys()].sort((a, b) => Number(b) - Number(a));
  const years = allYears.slice(0, yearCount);
  const ttmValues = ttm ? segmentLevelValues(ttm, names) : null;
  const priorTtmValues = priorTtm
    ? segmentLevelValues(priorTtm, names)
    : allYears[0]
      ? segmentLevelValues(byYear.get(allYears[0])?.data, names)
      : null;
  return [
    ...(ttmValues
      ? [
          withEnded(
            { key: "ttm-seg", label: "TTM", values: withSegmentGrowth(ttmValues, priorTtmValues, names) },
            ttmDate,
          ),
        ]
      : []),
    ...years.map((year) => {
      const current = segmentLevelValues(byYear.get(year)?.data, names);
      const priorYear = allYears[allYears.indexOf(year) + 1];
      const prior = priorYear ? segmentLevelValues(byYear.get(priorYear)?.data, names) : null;
      return withEnded(
        { key: year, label: fyLabel(year), values: withSegmentGrowth(current, prior, names) },
        byYear.get(year)?.date,
      );
    }),
  ];
}

export default async function FinancialsOverviewPage({
  params,
  searchParams,
}: {
  params: Promise<{ symbol: string }>;
  searchParams: Promise<{ years?: string }>;
}) {
  const { symbol } = await params;
  const { years: yearsParam } = await searchParams;
  const ticker = decodeTicker(symbol);
  const span = spanFrom(yearsParam);
  const yearCount = statementLimit("annual", span);
  const annualLimit = yearCount + 1;
  const fiscalLimit = Math.max(annualLimit, 16);
  const base = stockPath(ticker, "/financials");
  const priceFrom = priceFromForFilings("annual", yearCount);
  const [annualIncome, quarterlyIncome, ttmIncome, annualBalance, currentBalance, annualCash, quarterlyCash, ttmCash, products, productQuarters, geos, geoQuarters, dividends, quote, estimates, enterpriseRows, dailyCloses] =
    await Promise.all([
      getIncomeStatements(ticker, "annual", fiscalLimit),
      getIncomeStatements(ticker, "quarter", 8),
      getIncomeTtm(ticker),
      getBalanceSheets(ticker, "annual", annualLimit),
      getBalanceSheets(ticker, "quarter", 1),
      getCashFlows(ticker, "annual", annualLimit),
      getCashFlows(ticker, "quarter", 8),
      getCashFlowTtm(ticker),
      getRevenueProductSegments(ticker, "annual"),
      getRevenueProductSegments(ticker, "quarter"),
      getRevenueGeographicSegments(ticker, "annual"),
      getRevenueGeographicSegments(ticker, "quarter"),
      getDividends(ticker, DISTRIBUTION_HISTORY_LIMIT),
      getQuote(ticker),
      getEstimates(ticker, "annual"),
      getEnterpriseValues(ticker, "annual", annualLimit),
      getDailyChart(ticker, priceFrom),
    ]);
  const periodCloses = toCloseSeries(dailyCloses);

  const incomeYears = annualIncome.slice(0, yearCount);
  const currency = reportingCurrency(annualIncome[0]?.reportedCurrency, ttmIncome?.reportedCurrency);
  const money = compactMoneyFn(currency);
  const ttmIncomeSynthetic: FmpIncomeStatement | null = ttmIncome
    ? ttmIncome
    : quarterlyIncome.length >= 4
      ? ({
          ...quarterlyIncome[0],
          revenue: trailingSum(quarterlyIncome as Array<Record<string, unknown>>, "revenue", 0) ?? 0,
          grossProfit: trailingSum(quarterlyIncome as Array<Record<string, unknown>>, "grossProfit", 0) ?? 0,
          operatingIncome: trailingSum(quarterlyIncome as Array<Record<string, unknown>>, "operatingIncome", 0) ?? 0,
          netIncome: trailingSum(quarterlyIncome as Array<Record<string, unknown>>, "netIncome", 0) ?? 0,
          epsDiluted: trailingSum(quarterlyIncome as Array<Record<string, unknown>>, "epsDiluted", 0) ?? 0,
        } as FmpIncomeStatement)
      : null;
  const priorTtmIncome: FmpIncomeStatement | null =
    quarterlyIncome.length >= 8
      ? ({
          revenue: trailingSum(quarterlyIncome as Array<Record<string, unknown>>, "revenue", 4) ?? 0,
          grossProfit: trailingSum(quarterlyIncome as Array<Record<string, unknown>>, "grossProfit", 4) ?? 0,
          operatingIncome: trailingSum(quarterlyIncome as Array<Record<string, unknown>>, "operatingIncome", 4) ?? 0,
          netIncome: trailingSum(quarterlyIncome as Array<Record<string, unknown>>, "netIncome", 4) ?? 0,
          epsDiluted: trailingSum(quarterlyIncome as Array<Record<string, unknown>>, "epsDiluted", 4) ?? 0,
        } as FmpIncomeStatement)
      : incomeYears[0] ?? null;

  const profitColumns = [
    ...(ttmIncomeSynthetic
      ? [withEnded(incomeColumn("TTM", "ttm", ttmIncomeSynthetic, priorTtmIncome), quarterlyIncome[0]?.date)]
      : []),
    ...incomeYears.map((row, index) =>
      withEnded(
        incomeColumn(fyLabel(row.fiscalYear), row.date, row, annualIncome[index + 1] ?? null),
        row.date,
      ),
    ),
  ];

  const cashYears = annualCash.slice(0, yearCount);
  const cfRows = quarterlyCash as Array<Record<string, unknown>>;
  const priorTtmCash: FmpCashFlow | null =
    quarterlyCash.length >= 8
      ? ({
          operatingCashFlow: trailingSum(cfRows, "operatingCashFlow", 4) ?? 0,
          capitalExpenditure: trailingSum(cfRows, "capitalExpenditure", 4) ?? 0,
          freeCashFlow: trailingSum(cfRows, "freeCashFlow", 4) ?? 0,
        } as FmpCashFlow)
      : cashYears[0] ?? null;
  const ttmCashRow =
    ttmCash ??
    (quarterlyCash.length >= 4
      ? ({
          operatingCashFlow: trailingSum(cfRows, "operatingCashFlow", 0) ?? 0,
          capitalExpenditure: trailingSum(cfRows, "capitalExpenditure", 0) ?? 0,
          freeCashFlow: trailingSum(cfRows, "freeCashFlow", 0) ?? 0,
        } as FmpCashFlow)
      : null);
  const cashColumns = [
    ...(ttmCashRow ? [withEnded(cashColumn("TTM", "ttm-cf", ttmCashRow, priorTtmCash), quarterlyCash[0]?.date)] : []),
    ...cashYears.map((row, index) =>
      withEnded(cashColumn(fyLabel(row.fiscalYear), row.date, row, annualCash[index + 1] ?? null), row.date),
    ),
  ];

  const balanceYears = annualBalance.slice(0, yearCount);
  const latestBalance = currentBalance[0] ?? balanceYears[0] ?? null;
  const currentShares =
    n(ttmIncomeSynthetic?.weightedAverageShsOutDil) ??
    n(quarterlyIncome[0]?.weightedAverageShsOutDil) ??
    n(incomeYears[0]?.weightedAverageShsOutDil);
  const sharesByYear = new Map(
    annualIncome.map((row) => [String(row.fiscalYear), n(row.weightedAverageShsOutDil)]),
  );
  const cashDebtColumns = [
    ...(latestBalance
      ? [
          withEnded(
            balanceColumn(
              "Current",
              "current",
              latestBalance,
              balanceYears[0] ?? null,
              currentShares,
              sharesByYear.get(String(balanceYears[0]?.fiscalYear)) ?? null,
            ),
            latestBalance.date,
          ),
        ]
      : []),
    ...balanceYears.map((row, index) =>
      withEnded(
        balanceColumn(
          fyLabel(row.fiscalYear),
          row.date,
          row,
          annualBalance[index + 1] ?? null,
          sharesByYear.get(String(row.fiscalYear)) ?? null,
          sharesByYear.get(String(annualBalance[index + 1]?.fiscalYear)) ?? null,
        ),
        row.date,
      ),
    ),
  ];

  const cashByYear = new Map(cashYears.map((row) => [String(row.fiscalYear), row]));
  const marginColumns = [
    ...(ttmIncomeSynthetic
      ? [withEnded(marginColumn("TTM", "ttm-m", ttmIncomeSynthetic, ttmCashRow), quarterlyIncome[0]?.date)]
      : []),
    ...incomeYears.map((row) =>
      withEnded(
        marginColumn(fyLabel(row.fiscalYear), String(row.date), row, cashByYear.get(String(row.fiscalYear)) ?? null),
        row.date,
      ),
    ),
  ];
  let valuationColumns = [
    ...(quote
      ? [
          withEnded(
            {
              key: "current-v",
              label: "Current",
              values: {},
            },
            nyDateString(),
          ),
        ]
      : []),
    ...incomeYears.map((row) => withEnded({ key: String(row.date), label: fyLabel(row.fiscalYear), values: {} }, row.date)),
  ];
  valuationColumns = valuationColumns.map((column) => {
    if (column.key === "current-v") {
      return overlayValuationColumn(column, {
        price: quote?.price,
        marketCap: quote?.marketCap,
        income: ttmIncomeSynthetic as unknown as Record<string, unknown> | null,
        cash: ttmCashRow as unknown as Record<string, unknown> | null,
        balance: latestBalance as unknown as Record<string, unknown> | null,
        nextEps: nextEstimate(estimates)?.epsAvg,
      });
    }
    const year = incomeYears.find((row) => fyLabel(row.fiscalYear) === column.label);
    const enterprise = year ? matchEnterprise(enterpriseRows, year.date, year.fiscalYear) : null;
    const cash = cashYears.find((row) => year && String(row.fiscalYear) === String(year.fiscalYear));
    const sheet = balanceYears.find((row) => year && String(row.fiscalYear) === String(year.fiscalYear));
    const periodPrice = closeOnOrBefore(periodCloses, year?.date) ?? n(enterprise?.stockPrice);
    const shares = n(year?.weightedAverageShsOutDil) ?? n(enterprise?.numberOfShares);
    const overlaid = overlayValuationColumn(column, {
      price: periodPrice,
      marketCap: marketCapFromPrice(periodPrice, shares) ?? n(enterprise?.marketCapitalization),
      income: year as unknown as Record<string, unknown> | null,
      cash: cash as unknown as Record<string, unknown> | null,
      balance: sheet as unknown as Record<string, unknown> | null,
    });
    const values = { ...overlaid.values };
    delete values.forwardPe;
    return { ...overlaid, values };
  });

  const productTtm = ttmSegmentMap(productQuarters);
  const productPriorTtm = priorTtmSegmentMap(productQuarters);
  const names = productTtm
    ? Object.entries(productTtm)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8)
        .map(([name]) => name)
    : segmentNames(products);
  const productColumns = segmentColumns(
    products,
    names,
    productTtm,
    productPriorTtm,
    productQuarters[0]?.date,
    yearCount,
  );
  const geoTtm = ttmSegmentMap(geoQuarters);
  const geoPriorTtm = priorTtmSegmentMap(geoQuarters);
  const geoNames = geoTtm
    ? Object.entries(geoTtm)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8)
        .map(([name]) => name)
    : segmentNames(geos);
  const geoColumns = segmentColumns(geos, geoNames, geoTtm, geoPriorTtm, geoQuarters[0]?.date, yearCount);
  const revenueBars = [...incomeYears]
    .reverse()
    .filter((row) => typeof row.revenue === "number")
    .map((row) => ({ label: String(row.fiscalYear), value: row.revenue }));

  const today = nyDateString();
  const indicatedDividend = indicatedAnnualDividend(dividends[0], null);
  const ttmDividendGrowth = dividendTtmGrowth(dividends);
  const fiscalEnds = annualIncome.map((row) => ({ fiscalYear: row.fiscalYear, date: row.date }));
  const dividendByYear = dividendsByFiscalYear(dividends, fiscalEnds);
  const currentDividendYield =
    indicatedDividend != null && quote?.price && quote.price > 0 ? indicatedDividend / quote.price : null;
  const dividendColumns: YearMetricColumn[] = [
    {
      key: "current-div",
      label: "Current",
      ended: today,
      values: {
        dividend: indicatedDividend,
        dividendGrowth: ttmDividendGrowth,
        yield: currentDividendYield,
      },
    },
    ...incomeYears.map((row, index) => {
      const year = String(row.fiscalYear);
      const priorYear = String(annualIncome[index + 1]?.fiscalYear ?? "");
      const dps = dividendByYear.get(year) ?? null;
      const enterprise = matchEnterprise(enterpriseRows, row.date, row.fiscalYear);
      const yearEndPrice = closeOnOrBefore(periodCloses, row.date) ?? n(enterprise?.stockPrice);
      return {
        key: year,
        label: fyLabel(year),
        ended: row.date,
        values: {
          dividend: dps,
          dividendGrowth: yearOverYear(dps, priorYear ? dividendByYear.get(priorYear) : null),
          yield:
            dps != null && yearEndPrice != null && yearEndPrice > 0 ? dps / yearEndPrice : null,
        },
      };
    }),
  ];

  return (
    <Container>
      <PageHeader
        title={`${ticker} Financials Overview`}
        description={`Revenue, profits, segments, cash, and valuation in millions of ${currency} except ratios and per-share items. Period ending dates follow company filings. Fiscal valuation uses the last FMP close on or before each period end.`}
        actions={
          <YearToggle
            span={span}
            fiveHref={statementHref(base, "annual", "standardized", "5")}
            tenHref={statementHref(base, "annual", "standardized", "10")}
            maxHref={statementHref(base, "annual", "standardized", "max")}
          />
        }
      />
      <FinancialsNav symbol={ticker} />

      <section className="mt-6">
        <div className="mb-3 flex items-end justify-between gap-3">
          <h2 className="text-lg font-semibold text-header">Revenue & Profits</h2>
          <Link href={stockPath(ticker, "/financials/income-statement")} className="text-sm text-link hover:underline">
            Full income statement
          </Link>
        </div>
        <YearMetricTable
          columns={profitColumns}
          downloadName={`${ticker}-financials-overview-profits-${span}`}
          rows={[
            { key: "revenue", label: "Revenue", format: "money", href: `/stocks/${ticker}/revenue`, emphasize: true },
            { key: "revenueGrowth", label: "Revenue Growth", format: "percent" },
            { key: "grossProfit", label: "Gross Profit", format: "money", href: `/stocks/${ticker}/gross-profit` },
            { key: "grossProfitGrowth", label: "Gross Profit Growth", format: "percent" },
            { key: "operatingIncome", label: "Operating Income", format: "money", href: `/stocks/${ticker}/operating-income` },
            { key: "operatingIncomeGrowth", label: "Operating Income Growth", format: "percent" },
            { key: "netIncome", label: "Net Income", format: "money", href: `/stocks/${ticker}/net-income`, emphasize: true },
            { key: "netIncomeGrowth", label: "Net Income Growth", format: "percent" },
            { key: "eps", label: "EPS", format: "eps", href: `/stocks/${ticker}/earnings` },
            { key: "epsGrowth", label: "EPS Growth", format: "percent" },
          ]}
        />
        {revenueBars.length > 1 ? (
          <div className="mt-4">
            <HistoryBars items={revenueBars} formatValue={money} />
          </div>
        ) : null}
      </section>

      {names.length > 0 ? (
        <section className="mt-10">
          <div className="mb-3 flex items-end justify-between gap-3">
            <h2 className="text-lg font-semibold text-header">Revenue by Segment</h2>
            <Link href={`/stocks/${ticker}/revenue`} className="text-sm text-link hover:underline">
              Revenue page
            </Link>
          </div>
          <YearMetricTable
            columns={productColumns}
            rows={segmentTableRows(names)}
          />
        </section>
      ) : null}

      {geoNames.length > 0 ? (
        <section className="mt-10">
          <div className="mb-3 flex items-end justify-between gap-3">
            <h2 className="text-lg font-semibold text-header">Revenue by Geography</h2>
            <Link href={`/stocks/${ticker}/revenue`} className="text-sm text-link hover:underline">
              Revenue page
            </Link>
          </div>
          <YearMetricTable
            columns={geoColumns}
            rows={segmentTableRows(geoNames)}
          />
        </section>
      ) : null}

      <section className="mt-10">
        <div className="mb-3 flex items-end justify-between gap-3">
          <h2 className="text-lg font-semibold text-header">Cash & Debt</h2>
          <Link href={stockPath(ticker, "/financials/balance-sheet")} className="text-sm text-link hover:underline">
            Full balance sheet
          </Link>
        </div>
        <YearMetricTable
          columns={cashDebtColumns}
          rows={[
            { key: "cash", label: "Cash & Investments", format: "money", href: `/stocks/${ticker}/cash` },
            { key: "cashGrowth", label: "Cash & Investments Growth", format: "percent" },
            { key: "totalDebt", label: "Total Debt", format: "money", href: `/stocks/${ticker}/debt` },
            { key: "debtGrowth", label: "Total Debt Growth", format: "percent" },
            { key: "netCash", label: "Net Cash (Debt)", format: "money", href: `/stocks/${ticker}/net-cash`, emphasize: true },
            { key: "netCashGrowth", label: "Net Cash Growth", format: "percent" },
            { key: "netCashPerShare", label: "Net Cash Per Share", format: "eps", href: `/stocks/${ticker}/net-cash` },
            { key: "netCashPerShareGrowth", label: "Net Cash Per Share Growth", format: "percent" },
          ]}
        />
      </section>

      <section className="mt-10">
        <div className="mb-3 flex items-end justify-between gap-3">
          <h2 className="text-lg font-semibold text-header">Cash Flow & CapEx</h2>
          <Link href={stockPath(ticker, "/financials/cash-flow-statement")} className="text-sm text-link hover:underline">
            Full cash flow statement
          </Link>
        </div>
        <YearMetricTable
          columns={cashColumns}
          rows={[
            { key: "operatingCashFlow", label: "Operating Cash Flow", format: "money", href: `/stocks/${ticker}/operating-cash-flow` },
            { key: "ocfGrowth", label: "Operating Cash Flow Growth", format: "percent" },
            { key: "capex", label: "Capital Expenditures", format: "money", href: `/stocks/${ticker}/capex` },
            { key: "capexGrowth", label: "CapEx Growth", format: "percent" },
            { key: "freeCashFlow", label: "Free Cash Flow", format: "money", href: `/stocks/${ticker}/free-cash-flow`, emphasize: true },
            { key: "fcfGrowth", label: "FCF Growth", format: "percent" },
          ]}
        />
      </section>

      <section className="mt-10">
        <div className="mb-3 flex items-end justify-between gap-3">
          <h2 className="text-lg font-semibold text-header">Margins</h2>
          <Link href={`/stocks/${ticker}/financials/ratios`} className="text-sm text-link hover:underline">
            Full ratios
          </Link>
        </div>
        <YearMetricTable
          columns={marginColumns}
          rows={[
            { key: "grossMargin", label: "Gross Margin", format: "margin", href: `/stocks/${ticker}/gross-margin` },
            { key: "operatingMargin", label: "Operating Margin", format: "margin", href: `/stocks/${ticker}/operating-margin` },
            { key: "pretaxMargin", label: "Pretax Margin", format: "margin", href: `/stocks/${ticker}/pretax-margin` },
            { key: "profitMargin", label: "Profit Margin", format: "margin", href: `/stocks/${ticker}/profit-margin` },
            { key: "fcfMargin", label: "FCF Margin", format: "margin", href: `/stocks/${ticker}/fcf-margin` },
          ]}
        />
      </section>

      <section className="mt-10">
        <div className="mb-3 flex items-end justify-between gap-3">
          <h2 className="text-lg font-semibold text-header">Dividends</h2>
          <Link href={`/stocks/${ticker}/dividend`} className="text-sm text-link hover:underline">
            Dividend history
          </Link>
        </div>
        <YearMetricTable
          columns={dividendColumns}
          rows={[
            { key: "dividend", label: "Dividend Per Share", format: "eps" },
            { key: "dividendGrowth", label: "Dividend Per Share Growth", format: "percent" },
            { key: "yield", label: "Dividend Yield", format: "margin" },
          ]}
        />
      </section>

      <section className="mt-10">
        <div className="mb-3 flex items-end justify-between gap-3">
          <h2 className="text-lg font-semibold text-header">Valuation</h2>
          <Link href={`/stocks/${ticker}/financials/ratios`} className="text-sm text-link hover:underline">
            Full ratios
          </Link>
        </div>
        <YearMetricTable
          columns={valuationColumns}
          rows={[
            { key: "price", label: "Last Close Price", format: "price" },
            { key: "marketCap", label: "Market Capitalization", format: "money", href: `/stocks/${ticker}/market-cap` },
            { key: "enterpriseValue", label: "Enterprise Value", format: "money", href: `/stocks/${ticker}/enterprise-value` },
            { key: "pe", label: "PE Ratio", format: "ratio", href: `/stocks/${ticker}/pe-ratio` },
            { key: "forwardPe", label: "Forward PE", format: "ratio", href: `/stocks/${ticker}/forward-pe` },
            { key: "ps", label: "PS Ratio", format: "ratio", href: `/stocks/${ticker}/ps-ratio` },
            { key: "pb", label: "PB Ratio", format: "ratio", href: `/stocks/${ticker}/pb-ratio` },
            { key: "pfcf", label: "P/FCF Ratio", format: "ratio", href: `/stocks/${ticker}/pfcf-ratio` },
            { key: "pocf", label: "P/OCF Ratio", format: "ratio", href: `/stocks/${ticker}/pocf-ratio` },
            { key: "evSales", label: "EV / Sales", format: "ratio", href: `/stocks/${ticker}/ev-sales` },
            { key: "evEbitda", label: "EV / EBITDA", format: "ratio", href: `/stocks/${ticker}/ev-ebitda` },
            { key: "evEbit", label: "EV / EBIT", format: "ratio", href: `/stocks/${ticker}/ev-ebit` },
            { key: "evEarnings", label: "EV / Earnings", format: "ratio", href: `/stocks/${ticker}/ev-earnings` },
            { key: "evFcf", label: "EV / FCF", format: "ratio", href: `/stocks/${ticker}/ev-fcf` },
            { key: "earningsYield", label: "Earnings Yield", format: "margin", href: `/stocks/${ticker}/earnings-yield` },
            { key: "fcfYield", label: "FCF Yield", format: "margin", href: `/stocks/${ticker}/fcf-yield` },
          ]}
        />
      </section>
    </Container>
  );
}
