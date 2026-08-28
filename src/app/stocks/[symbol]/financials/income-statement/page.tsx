import { Container } from "@/components/container";
import { FinancialsNav } from "@/components/financials-nav";
import { PageHeader, StatementToolbar } from "@/components/page-header";
import { StatementCharts } from "@/components/statement-charts";
import { StatementTable } from "@/components/statement-table";
import {
  getCashFlows,
  getCashFlowTtm,
  getDividends,
  getIncomeAsReported,
  getIncomeStatements,
  getIncomeTtm,
} from "@/lib/fmp";
import { formatMillions, formatPrice, reportingCurrency, yearOverYear } from "@/lib/format";
import { decodeTicker, stockPath } from "@/lib/listings";
import { dividendsByFiscalYear, dividendTtmGrowth, trailingDividendThrough, trailingDividendTotal } from "@/lib/dividends";
import {
  ADDITIONAL_INCOME_ROWS,
  CASH_TRAILING_SUM_KEYS,
  INCOME_ROWS,
  INCOME_TRAILING_LATEST_KEYS,
  INCOME_TRAILING_SUM_KEYS,
  asReportedColumns,
  asReportedStatementRows,
  mergeStatementValues,
  sourceFrom,
  spanFrom,
  statementChartItems,
  statementLimit,
  statementToolbarHrefs,
  toStatementColumns,
  toTrailingColumns,
  viewFrom,
  viewPeriodFrom,
  withAdjacentGrowth,
  withDerivedStatementMetrics,
  withStatementHrefs,
  withTtmColumn,
} from "@/lib/statements";
import type { StatementPeriod } from "@/lib/types";

export default async function IncomeStatementPage({
  params,
  searchParams,
}: {
  params: Promise<{ symbol: string }>;
  searchParams: Promise<{ period?: string; source?: string; years?: string; view?: string }>;
}) {
  const { symbol } = await params;
  const { period: periodParam, source: sourceParam, years: yearsParam, view: viewParam } = await searchParams;
  const ticker = decodeTicker(symbol);
  const viewPeriod = viewPeriodFrom(periodParam);
  const period: StatementPeriod = viewPeriod === "quarter" ? "quarter" : "annual";
  const source = sourceFrom(sourceParam);
  const span = spanFrom(yearsParam);
  const view = source === "reported" ? "dollars" : viewFrom(viewParam);
  const trailing = viewPeriod === "trailing" && source === "standardized";
  const displayCount = trailing ? statementLimit("quarter", span) : statementLimit(period, span);
  const incomeLimit = trailing ? displayCount + 4 : period === "annual" ? Math.max(displayCount + 12, 20) : displayCount;
  const base = stockPath(ticker, "/financials/income-statement");
  const [annual, quarterly, ttm, reported, annualCash, quarterlyCash, ttmCash, dividends] = await Promise.all([
    source === "standardized" && !trailing ? getIncomeStatements(ticker, period, incomeLimit) : Promise.resolve([]),
    source === "standardized" && trailing
      ? getIncomeStatements(ticker, "quarter", displayCount + 4)
      : Promise.resolve([]),
    source === "standardized" ? getIncomeTtm(ticker) : Promise.resolve(null),
    source === "reported" ? getIncomeAsReported(ticker, period, displayCount) : Promise.resolve([]),
    source === "standardized" && !trailing ? getCashFlows(ticker, period, displayCount) : Promise.resolve([]),
    source === "standardized" && trailing ? getCashFlows(ticker, "quarter", displayCount + 4) : Promise.resolve([]),
    source === "standardized" ? getCashFlowTtm(ticker) : Promise.resolve(null),
    source === "standardized" ? getDividends(ticker, 80) : Promise.resolve([]),
  ]);
  const currency = reportingCurrency(
    annual[0]?.reportedCurrency,
    quarterly[0]?.reportedCurrency,
    ttm?.reportedCurrency,
    reported[0]?.reportedCurrency,
  );
  const dividendByYear = dividendsByFiscalYear(
    dividends,
    (trailing ? quarterly : annual).map((row) => ({ fiscalYear: row.fiscalYear, date: row.date })),
  );
  let columns =
    source === "reported"
      ? asReportedColumns(reported, period)
      : trailing
        ? toTrailingColumns(quarterly, displayCount, INCOME_TRAILING_SUM_KEYS, INCOME_TRAILING_LATEST_KEYS)
        : withTtmColumn(
            ttm as Record<string, unknown> | null,
            toStatementColumns(annual.slice(0, displayCount), period),
          );

  if (source === "standardized") {
    const cashColumns = trailing
      ? toTrailingColumns(quarterlyCash, displayCount, CASH_TRAILING_SUM_KEYS)
      : withTtmColumn(ttmCash as Record<string, unknown> | null, toStatementColumns(annualCash, period));
    columns = mergeStatementValues(columns, cashColumns.map((column) => column.values), [
      "freeCashFlow",
      "depreciationAndAmortization",
    ]);
    columns = columns.map((column) => {
      const year = String(column.values.fiscalYear ?? "");
      const endDate = String(column.values.date ?? ttm?.date ?? "");
      const dividend =
        column.key === "ttm" || column.label === "TTM"
          ? trailingDividendThrough(dividends, endDate) ?? trailingDividendTotal(dividends)
          : trailing
            ? trailingDividendThrough(dividends, endDate)
            : (dividendByYear.get(year) ?? null);
      return {
        ...column,
        values: {
          ...column.values,
          dividendPerShare: dividend,
        },
      };
    });
    columns = withDerivedStatementMetrics(columns);
    if (trailing) {
      columns = withAdjacentGrowth(columns, "dividendPerShare", "dividendGrowth", 4);
    } else {
      columns = columns.map((column) => {
        if (column.key === "ttm" || column.label === "TTM") {
          return {
            ...column,
            values: { ...column.values, dividendGrowth: dividendTtmGrowth(dividends) },
          };
        }
        const year = Number(column.values.fiscalYear);
        const prior = Number.isFinite(year) ? dividendByYear.get(String(year - 1)) : null;
        return {
          ...column,
          values: {
            ...column.values,
            dividendGrowth: yearOverYear(column.values.dividendPerShare, prior),
          },
        };
      });
    }
  }

  const hrefRows = withStatementHrefs(INCOME_ROWS, ticker);
  const extraRows = withStatementHrefs(ADDITIONAL_INCOME_ROWS, ticker);

  return (
    <Container>
      <PageHeader
        title={`${ticker} Income Statement`}
        description={
          source === "reported"
            ? `As-reported XBRL line items from company filings. Figures in millions of ${currency} except per-share items.`
            : view === "common-size"
              ? "Each income-statement line is a percentage of revenue. Charts remain in dollars."
              : trailing
                ? `Rolling trailing-twelve-month income. Each column sums four quarters. Figures in millions of ${currency} except per-share items.`
                : `Revenue, expenses, and profitability. Figures in millions of ${currency} except per-share items.`
        }
        actions={
          <StatementToolbar
            period={viewPeriod}
            source={source}
            span={span}
            view={view}
            {...statementToolbarHrefs(base, viewPeriod, source, span, view)}
          />
        }
      />
      <FinancialsNav symbol={ticker} />
      {source === "standardized" ? (
        <StatementCharts
          formatValue={formatMillions}
          series={[
            { title: "Revenue", items: statementChartItems(columns, "revenue") },
            { title: "Gross Profit", items: statementChartItems(columns, "grossProfit") },
            { title: "Operating Income", items: statementChartItems(columns, "operatingIncome") },
            { title: "Net Income", items: statementChartItems(columns, "netIncome") },
            {
              title: "EPS (Diluted)",
              items: statementChartItems(columns, "epsDiluted"),
              formatValue: formatPrice,
            },
          ]}
        />
      ) : null}
      {source === "reported" ? (
        <StatementTable
          rows={asReportedStatementRows(reported)}
          columns={columns}
          scale="millions"
          currency={currency}
          caption={`Values in millions of ${currency}. Line labels follow the company's as-reported US-GAAP tags, not FMP's standardized statement.`}
          downloadName={`${ticker}-income-as-reported-${period}-${span}`}
        />
      ) : (
        <>
          <StatementTable
            rows={hrefRows}
            columns={columns}
            scale="millions"
            currency={currency}
            commonSizeBase={view === "common-size" ? "revenue" : undefined}
            yoyOffset={trailing ? 4 : 1}
            caption={
              view === "common-size"
                ? "Percent of revenue. EPS and share counts stay in original units. Green/red year-over-year change is hidden in this view."
                : trailing
                  ? `Values in millions of ${currency}. Green/red percentages compare each trailing window with the same quarter a year earlier.`
                  : `Values in millions of ${currency}. The TTM column is trailing twelve months; green/red percentages are year-over-year change.`
            }
            downloadName={`${ticker}-income-${viewPeriod}-${span}${view === "common-size" ? "-common-size" : ""}`}
          />
          {view === "dollars" ? (
            <section className="mt-10">
              <h2 className="mb-3 text-lg font-semibold text-header">Additional Metrics</h2>
              <StatementTable
                rows={extraRows}
                columns={columns}
                scale="millions"
                currency={currency}
                yoyOffset={trailing ? 4 : 1}
                caption="Free cash flow, dividends, margins, and EBIT from the matching cash-flow statement and income lines."
                downloadName={`${ticker}-income-additional-${viewPeriod}-${span}`}
              />
            </section>
          ) : null}
        </>
      )}
    </Container>
  );
}
