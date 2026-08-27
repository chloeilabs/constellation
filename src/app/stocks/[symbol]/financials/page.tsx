import Link from "next/link";
import { Container } from "@/components/container";
import { FinancialsNav } from "@/components/financials-nav";
import { PageHeader } from "@/components/page-header";
import { HistoryBars } from "@/components/history-bars";
import { YearMetricTable, type YearMetricColumn } from "@/components/year-metric-table";
import { compactMoneyFn, reportingCurrency, yearOverYear } from "@/lib/format";
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
import { decodeTicker, stockPath } from "@/lib/listings";
import { canonicalSegmentName, trailingSum, ttmSegmentMap } from "@/lib/statements";
import type { FmpBalanceSheet, FmpCashFlow, FmpIncomeStatement, FmpRatios, FmpRevenueSegment } from "@/lib/types";

function n(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
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

function fillMarginGaps(
  columns: YearMetricColumn[],
  income: Array<{ label: string; row: FmpIncomeStatement | null }>,
  cash: Array<{ label: string; row: FmpCashFlow | null }>,
) {
  const incomeMap = new Map(income.map((item) => [item.label, item.row]));
  const cashMap = new Map(cash.map((item) => [item.label, item.row]));
  return columns.map((column) => {
    const statement = incomeMap.get(column.label);
    const flow = cashMap.get(column.label);
    const revenue = n(statement?.revenue);
    const pretax = n(statement?.incomeBeforeTax);
    const fcf = n(flow?.freeCashFlow);
    return {
      ...column,
      values: {
        ...column.values,
        pretaxMargin:
          n(column.values.pretaxMargin) ??
          (revenue && pretax != null ? pretax / revenue : null),
        fcfMargin: n(column.values.fcfMargin) ?? (revenue && fcf != null ? fcf / revenue : null),
      },
    };
  });
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
  const byYear = new Map<string, Record<string, number>>();
  for (const row of rows) {
    const data: Record<string, number> = {};
    for (const [name, value] of Object.entries(row.data ?? {})) {
      if (typeof value !== "number" || !Number.isFinite(value)) continue;
      const key = canonicalSegmentName(name);
      data[key] = (data[key] ?? 0) + value;
    }
    byYear.set(String(row.fiscalYear), data);
  }
  return byYear;
}

function segmentColumnFromMap(label: string, key: string, data: Record<string, number> | null, names: string[]): YearMetricColumn {
  const values: Record<string, number | null> = {};
  for (const name of names) values[name] = n(data?.[name]);
  const namedTotal = names.reduce((sum, name) => sum + (values[name] ?? 0), 0);
  values.total =
    namedTotal ||
    n(Object.values(data ?? {}).reduce((sum, value) => sum + (typeof value === "number" ? value : 0), 0));
  return { key, label, values };
}

function segmentColumns(rows: FmpRevenueSegment[], names: string[], ttm?: Record<string, number> | null): YearMetricColumn[] {
  const byYear = segmentLookup(rows);
  const years = [...new Set(rows.map((row) => String(row.fiscalYear)))]
    .sort((a, b) => Number(b) - Number(a))
    .slice(0, 5);
  return [
    ...(ttm ? [segmentColumnFromMap("TTM", "ttm-seg", ttm, names)] : []),
    ...years.map((year) => segmentColumnFromMap(fyLabel(year), year, byYear.get(year) ?? {}, names)),
  ];
}

export default async function FinancialsOverviewPage({ params }: { params: Promise<{ symbol: string }> }) {
  const { symbol } = await params;
  const ticker = decodeTicker(symbol);
  const [annualIncome, quarterlyIncome, ttmIncome, annualBalance, currentBalance, annualCash, quarterlyCash, ttmCash, annualRatios, ttmRatios, products, productQuarters, geos, geoQuarters, dividends] =
    await Promise.all([
      getIncomeStatements(ticker, "annual", 6),
      getIncomeStatements(ticker, "quarter", 8),
      getIncomeTtm(ticker),
      getBalanceSheets(ticker, "annual", 6),
      getBalanceSheets(ticker, "quarter", 1),
      getCashFlows(ticker, "annual", 6),
      getCashFlows(ticker, "quarter", 8),
      getCashFlowTtm(ticker),
      getRatios(ticker, "annual", 6),
      getRatiosTtm(ticker),
      getRevenueProductSegments(ticker, "annual"),
      getRevenueProductSegments(ticker, "quarter"),
      getRevenueGeographicSegments(ticker, "annual"),
      getRevenueGeographicSegments(ticker, "quarter"),
      getDividends(ticker, 8),
    ]);

  const incomeYears = annualIncome.slice(0, 5);
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
      ? [incomeColumn("TTM", "ttm", ttmIncomeSynthetic, priorTtmIncome)]
      : []),
    ...incomeYears.map((row, index) => incomeColumn(fyLabel(row.fiscalYear), row.date, row, incomeYears[index + 1] ?? null)),
  ];

  const cashYears = annualCash.slice(0, 5);
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
    ...(ttmCashRow ? [cashColumn("TTM", "ttm-cf", ttmCashRow, priorTtmCash)] : []),
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
    pretaxMargin: "pretaxProfitMarginTTM",
    profitMargin: "netProfitMarginTTM",
    fcfMargin: "freeCashFlowMarginTTM",
    pe: "priceToEarningsRatioTTM",
    ps: "priceToSalesRatioTTM",
    pfcf: "priceToFreeCashFlowRatioTTM",
    dividendYield: "dividendYieldTTM",
  };
  const annualRatioMap = {
    grossMargin: "grossProfitMargin",
    operatingMargin: "operatingProfitMargin",
    pretaxMargin: "pretaxProfitMargin",
    profitMargin: "netProfitMargin",
    fcfMargin: "freeCashFlowMargin",
    pe: "priceToEarningsRatio",
    ps: "priceToSalesRatio",
    pfcf: "priceToFreeCashFlowRatio",
    dividendYield: "dividendYield",
  };
  const marginColumns = fillMarginGaps(
    [
      ...(ttmRatios ? [ratioColumn("TTM", "ttm-m", ttmRatios as Record<string, unknown>, ttmRatioMap)] : []),
      ...ratioYears.map((row) => ratioColumn(fyLabel(row.fiscalYear), String(row.date), row, annualRatioMap)),
    ],
    [
      { label: "TTM", row: ttmIncomeSynthetic },
      ...incomeYears.map((row) => ({ label: fyLabel(row.fiscalYear), row })),
    ],
    [
      { label: "TTM", row: ttmCashRow },
      ...cashYears.map((row) => ({ label: fyLabel(row.fiscalYear), row })),
    ],
  );
  const valuationColumns = [
    ...(ttmRatios ? [ratioColumn("Current", "current-v", ttmRatios as Record<string, unknown>, ttmRatioMap)] : []),
    ...ratioYears.map((row) => ratioColumn(fyLabel(row.fiscalYear), String(row.date), row, annualRatioMap)),
  ];

  const productTtm = ttmSegmentMap(productQuarters);
  const names = productTtm
    ? Object.entries(productTtm)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8)
        .map(([name]) => name)
    : segmentNames(products);
  const productColumns = segmentColumns(products, names, productTtm);
  const geoTtm = ttmSegmentMap(geoQuarters);
  const geoNames = geoTtm
    ? Object.entries(geoTtm)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8)
        .map(([name]) => name)
    : segmentNames(geos);
  const geoColumns = segmentColumns(geos, geoNames, geoTtm);
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
        description={`Revenue, profits, segments, cash, and valuation in millions of ${currency} except ratios and per-share items.`}
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
          <Link href={stockPath(ticker, "/financials/balance-sheet")} className="text-sm text-link hover:underline">
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
          <Link href={stockPath(ticker, "/financials/cash-flow-statement")} className="text-sm text-link hover:underline">
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
            { key: "pretaxMargin", label: "Pretax Margin", format: "margin" },
            { key: "profitMargin", label: "Profit Margin", format: "margin", href: `/stocks/${ticker}/net-income` },
            { key: "fcfMargin", label: "FCF Margin", format: "margin", href: `/stocks/${ticker}/free-cash-flow` },
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
