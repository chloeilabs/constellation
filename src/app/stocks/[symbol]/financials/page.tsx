import Link from "next/link";
import { Container } from "@/components/container";
import { FinancialsNav } from "@/components/financials-nav";
import { PageHeader } from "@/components/page-header";
import { HistoryBars } from "@/components/history-bars";
import { YearMetricTable, type YearMetricColumn } from "@/components/year-metric-table";
import { formatCompactUsd, yearOverYear } from "@/lib/format";
import {
  getBalanceSheets,
  getCashFlows,
  getCashFlowTtm,
  getDividends,
  getIncomeStatements,
  getIncomeTtm,
  getRatios,
  getRatiosTtm,
  getRevenueGeographicSegments,
  getRevenueProductSegments,
} from "@/lib/fmp";
import type { FmpBalanceSheet, FmpCashFlow, FmpIncomeStatement, FmpRatios, FmpRevenueSegment } from "@/lib/types";

function n(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function trailingSum(rows: Array<Record<string, unknown>>, field: string, start: number) {
  const slice = rows.slice(start, start + 4);
  if (slice.length < 4) return null;
  let total = 0;
  for (const row of slice) {
    const value = row[field];
    if (typeof value !== "number" || !Number.isFinite(value)) return null;
    total += value;
  }
  return total;
}

function fyLabel(year: string | number | undefined) {
  return year != null ? `FY ${year}` : "—";
}

function incomeColumn(label: string, key: string, row: FmpIncomeStatement | null, prior: FmpIncomeStatement | null): YearMetricColumn {
  return {
    key,
    label,
    values: {
      revenue: n(row?.revenue),
      revenueGrowth: yearOverYear(row?.revenue, prior?.revenue),
      grossProfit: n(row?.grossProfit),
      operatingIncome: n(row?.operatingIncome),
      netIncome: n(row?.netIncome),
      eps: n(row?.epsDiluted ?? row?.eps),
      epsGrowth: yearOverYear(row?.epsDiluted ?? row?.eps, prior?.epsDiluted ?? prior?.eps),
    },
  };
}

function cashColumn(label: string, key: string, row: FmpCashFlow | null, prior: FmpCashFlow | null): YearMetricColumn {
  return {
    key,
    label,
    values: {
      operatingCashFlow: n(row?.operatingCashFlow ?? row?.netCashProvidedByOperatingActivities),
      capex: n(row?.capitalExpenditure),
      freeCashFlow: n(row?.freeCashFlow),
      fcfGrowth: yearOverYear(row?.freeCashFlow, prior?.freeCashFlow),
    },
  };
}

function balanceColumn(label: string, key: string, row: FmpBalanceSheet | null, prior: FmpBalanceSheet | null): YearMetricColumn {
  const cash = n(row?.cashAndShortTermInvestments);
  const debt = n(row?.totalDebt);
  const priorCash = n(prior?.cashAndShortTermInvestments);
  const priorDebt = n(prior?.totalDebt);
  const netCash = cash != null && debt != null ? cash - debt : null;
  const priorNet = priorCash != null && priorDebt != null ? priorCash - priorDebt : null;
  return {
    key,
    label,
    values: {
      cash,
      totalDebt: debt,
      netCash,
      netCashGrowth: yearOverYear(netCash, priorNet),
    },
  };
}

function ratioColumn(
  label: string,
  key: string,
  row: FmpRatios | Record<string, unknown> | null,
  map: Record<string, string>,
): YearMetricColumn {
  const values: Record<string, number | null> = {};
  for (const [outKey, inKey] of Object.entries(map)) {
    values[outKey] = n(row?.[inKey]);
  }
  return { key, label, values };
}

function cleanSegmentName(name: string) {
  return name.replace(/\s+segment$/i, "").trim();
}

function segmentNames(rows: FmpRevenueSegment[], limit = 8) {
  const latest = rows[0]?.data;
  if (!latest) return [];
  return Object.entries(latest)
    .filter(([, value]) => typeof value === "number" && value > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([name]) => name);
}

function segmentLookup(rows: FmpRevenueSegment[]) {
  const byYear = new Map<string, Record<string, number>>();
  for (const row of rows) {
    byYear.set(String(row.fiscalYear), row.data ?? {});
  }
  return byYear;
}

function segmentColumns(rows: FmpRevenueSegment[], names: string[]): YearMetricColumn[] {
  const byYear = segmentLookup(rows);
  const years = [...new Set(rows.map((row) => String(row.fiscalYear)))]
    .sort((a, b) => Number(b) - Number(a))
    .slice(0, 5);
  return years.map((year) => {
    const data = byYear.get(year) ?? {};
    const values: Record<string, number | null> = {};
    for (const name of names) values[name] = n(data[name]);
    const namedTotal = names.reduce((sum, name) => sum + (values[name] ?? 0), 0);
    values.total = namedTotal || n(Object.values(data).reduce((sum, value) => sum + (typeof value === "number" ? value : 0), 0));
    return { key: year, label: fyLabel(year), values };
  });
}

export default async function FinancialsOverviewPage({ params }: { params: Promise<{ symbol: string }> }) {
  const { symbol } = await params;
  const ticker = symbol.toUpperCase();
  const [annualIncome, quarterlyIncome, ttmIncome, annualBalance, currentBalance, annualCash, ttmCash, annualRatios, ttmRatios, products, geos, dividends] =
    await Promise.all([
      getIncomeStatements(ticker, "annual", 6),
      getIncomeStatements(ticker, "quarter", 8),
      getIncomeTtm(ticker),
      getBalanceSheets(ticker, "annual", 6),
      getBalanceSheets(ticker, "quarter", 1),
      getCashFlows(ticker, "annual", 6),
      getCashFlowTtm(ticker),
      getRatios(ticker, "annual", 6),
      getRatiosTtm(ticker),
      getRevenueProductSegments(ticker, "annual"),
      getRevenueGeographicSegments(ticker, "annual"),
      getDividends(ticker, 8),
    ]);

  const incomeYears = annualIncome.slice(0, 5);
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
      ? [incomeColumn("TTM", "ttm", ttmIncomeSynthetic, priorTtmIncome)]
      : []),
    ...incomeYears.map((row, index) => incomeColumn(fyLabel(row.fiscalYear), row.date, row, incomeYears[index + 1] ?? null)),
  ];

  const cashYears = annualCash.slice(0, 5);
  const cashColumns = [
    ...(ttmCash ? [cashColumn("TTM", "ttm-cf", ttmCash, cashYears[0] ?? null)] : []),
    ...cashYears.map((row, index) => cashColumn(fyLabel(row.fiscalYear), row.date, row, cashYears[index + 1] ?? null)),
  ];

  const balanceYears = annualBalance.slice(0, 5);
  const latestBalance = currentBalance[0] ?? balanceYears[0] ?? null;
  const cashDebtColumns = [
    ...(latestBalance ? [balanceColumn("Current", "current", latestBalance, balanceYears[0] ?? null)] : []),
    ...balanceYears.map((row, index) => balanceColumn(fyLabel(row.fiscalYear), row.date, row, balanceYears[index + 1] ?? null)),
  ];

  const ratioYears = annualRatios.slice(0, 5);
  const ttmRatioMap = {
    grossMargin: "grossProfitMarginTTM",
    operatingMargin: "operatingProfitMarginTTM",
    profitMargin: "netProfitMarginTTM",
    pe: "priceToEarningsRatioTTM",
    ps: "priceToSalesRatioTTM",
    pfcf: "priceToFreeCashFlowRatioTTM",
    dividendYield: "dividendYieldTTM",
  };
  const annualRatioMap = {
    grossMargin: "grossProfitMargin",
    operatingMargin: "operatingProfitMargin",
    profitMargin: "netProfitMargin",
    pe: "priceToEarningsRatio",
    ps: "priceToSalesRatio",
    pfcf: "priceToFreeCashFlowRatio",
    dividendYield: "dividendYield",
  };
  const marginColumns = [
    ...(ttmRatios ? [ratioColumn("TTM", "ttm-m", ttmRatios as Record<string, unknown>, ttmRatioMap)] : []),
    ...ratioYears.map((row) => ratioColumn(fyLabel(row.fiscalYear), String(row.date), row, annualRatioMap)),
  ];
  const valuationColumns = [
    ...(ttmRatios ? [ratioColumn("Current", "current-v", ttmRatios as Record<string, unknown>, ttmRatioMap)] : []),
    ...ratioYears.map((row) => ratioColumn(fyLabel(row.fiscalYear), String(row.date), row, annualRatioMap)),
  ];

  const names = segmentNames(products);
  const productColumns = segmentColumns(products, names);
  const geoNames = segmentNames(geos);
  const geoColumns = segmentColumns(geos, geoNames);
  const revenueBars = [...incomeYears]
    .reverse()
    .filter((row) => typeof row.revenue === "number")
    .map((row) => ({ label: String(row.fiscalYear), value: row.revenue }));

  const ttmDividend = dividends.slice(0, 4).reduce((sum, row) => sum + (row.dividend || 0), 0);
  const dividendByYear = new Map<string, number>();
  for (const row of dividends) {
    const year = String(row.date).slice(0, 4);
    dividendByYear.set(year, (dividendByYear.get(year) ?? 0) + (row.dividend || 0));
  }
  const dividendYears = [...dividendByYear.keys()].sort((a, b) => b.localeCompare(a)).slice(0, 5);
  const dividendColumns: YearMetricColumn[] = [
    {
      key: "current-div",
      label: "Current",
      values: {
        dividend: ttmDividend || null,
        yield: n((ttmRatios as Record<string, unknown> | null)?.dividendYieldTTM),
      },
    },
    ...dividendYears.map((year) => ({
      key: year,
      label: fyLabel(year),
      values: {
        dividend: dividendByYear.get(year) ?? null,
        yield: n(ratioYears.find((row) => String(row.fiscalYear) === year)?.dividendYield),
      },
    })),
  ];

  return (
    <Container>
      <PageHeader
        title={`${ticker} Financials Overview`}
        description="Revenue, profits, segments, cash, and valuation in millions of USD except ratios and per-share items."
      />
      <FinancialsNav symbol={ticker} />

      <section className="mt-6">
        <div className="mb-3 flex items-end justify-between gap-3">
          <h2 className="text-lg font-semibold text-header">Revenue & Profits</h2>
          <Link href={`/stocks/${ticker}/financials/income-statement`} className="text-sm text-link hover:underline">
            Full income statement
          </Link>
        </div>
        <YearMetricTable
          columns={profitColumns}
          rows={[
            { key: "revenue", label: "Revenue", format: "money", href: `/stocks/${ticker}/revenue`, emphasize: true },
            { key: "revenueGrowth", label: "Revenue Growth", format: "percent" },
            { key: "grossProfit", label: "Gross Profit", format: "money", href: `/stocks/${ticker}/gross-profit` },
            { key: "operatingIncome", label: "Operating Income", format: "money", href: `/stocks/${ticker}/operating-income` },
            { key: "netIncome", label: "Net Income", format: "money", href: `/stocks/${ticker}/net-income`, emphasize: true },
            { key: "eps", label: "EPS", format: "eps", href: `/stocks/${ticker}/earnings` },
            { key: "epsGrowth", label: "EPS Growth", format: "percent" },
          ]}
        />
        {revenueBars.length > 1 ? (
          <div className="mt-4">
            <HistoryBars items={revenueBars} formatValue={formatCompactUsd} />
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
            rows={[
              ...names.map((name) => ({ key: name, label: cleanSegmentName(name), format: "money" as const })),
              { key: "total", label: "Revenue (Total)", format: "money", emphasize: true },
            ]}
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
            rows={[
              ...geoNames.map((name) => ({ key: name, label: cleanSegmentName(name), format: "money" as const })),
              { key: "total", label: "Revenue (Total)", format: "money", emphasize: true },
            ]}
          />
        </section>
      ) : null}

      <section className="mt-10">
        <div className="mb-3 flex items-end justify-between gap-3">
          <h2 className="text-lg font-semibold text-header">Cash & Debt</h2>
          <Link href={`/stocks/${ticker}/financials/balance-sheet`} className="text-sm text-link hover:underline">
            Full balance sheet
          </Link>
        </div>
        <YearMetricTable
          columns={cashDebtColumns}
          rows={[
            { key: "cash", label: "Cash & Investments", format: "money", href: `/stocks/${ticker}/cash` },
            { key: "totalDebt", label: "Total Debt", format: "money", href: `/stocks/${ticker}/debt` },
            { key: "netCash", label: "Net Cash (Debt)", format: "money", emphasize: true },
            { key: "netCashGrowth", label: "Net Cash Growth", format: "percent" },
          ]}
        />
      </section>

      <section className="mt-10">
        <div className="mb-3 flex items-end justify-between gap-3">
          <h2 className="text-lg font-semibold text-header">Cash Flow & CapEx</h2>
          <Link href={`/stocks/${ticker}/financials/cash-flow-statement`} className="text-sm text-link hover:underline">
            Full cash flow statement
          </Link>
        </div>
        <YearMetricTable
          columns={cashColumns}
          rows={[
            { key: "operatingCashFlow", label: "Operating Cash Flow", format: "money" },
            { key: "capex", label: "Capital Expenditures", format: "money", href: `/stocks/${ticker}/capex` },
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
            { key: "grossMargin", label: "Gross Margin", format: "margin", href: `/stocks/${ticker}/gross-profit` },
            { key: "operatingMargin", label: "Operating Margin", format: "margin" },
            { key: "profitMargin", label: "Profit Margin", format: "margin", href: `/stocks/${ticker}/net-income` },
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
            { key: "yield", label: "Dividend Yield", format: "margin" },
          ]}
        />
      </section>

      <section className="mt-10">
        <div className="mb-3 flex items-end justify-between gap-3">
          <h2 className="text-lg font-semibold text-header">Valuation</h2>
          <Link href={`/stocks/${ticker}/statistics`} className="text-sm text-link hover:underline">
            Statistics
          </Link>
        </div>
        <YearMetricTable
          columns={valuationColumns}
          rows={[
            { key: "pe", label: "PE Ratio", format: "ratio", href: `/stocks/${ticker}/pe-ratio` },
            { key: "ps", label: "PS Ratio", format: "ratio", href: `/stocks/${ticker}/ps-ratio` },
            { key: "pfcf", label: "P/FCF Ratio", format: "ratio", href: `/stocks/${ticker}/free-cash-flow` },
          ]}
        />
      </section>
    </Container>
  );
}
