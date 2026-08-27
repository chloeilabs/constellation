import { Container } from "@/components/container";
import { FinancialsNav } from "@/components/financials-nav";
import { PageHeader, StatementToolbar } from "@/components/page-header";
import { StatementCharts } from "@/components/statement-charts";
import { StatementTable } from "@/components/statement-table";
import { getCashFlowAsReported, getCashFlows, getCashFlowTtm, getIncomeStatements, getIncomeTtm } from "@/lib/fmp";
import { formatMillions, reportingCurrency } from "@/lib/format";
import { decodeTicker, stockPath } from "@/lib/listings";
import {
  CASH_FLOW_ROWS,
  CASH_TRAILING_SUM_KEYS,
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
  withRevenueBase,
  withStatementHrefs,
  withTtmColumn,
} from "@/lib/statements";
import type { StatementPeriod } from "@/lib/types";

export default async function CashFlowPage({
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
  const base = stockPath(ticker, "/financials/cash-flow-statement");
  const wantRevenue = source === "standardized" && view === "common-size";
  const [rows, quarterly, ttm, reported, income, incomeQuarters, incomeTtm] = await Promise.all([
    source === "standardized" && !trailing ? getCashFlows(ticker, period, displayCount) : Promise.resolve([]),
    source === "standardized" && trailing ? getCashFlows(ticker, "quarter", displayCount + 4) : Promise.resolve([]),
    source === "standardized" ? getCashFlowTtm(ticker) : Promise.resolve(null),
    source === "reported" ? getCashFlowAsReported(ticker, period, displayCount) : Promise.resolve([]),
    wantRevenue && !trailing ? getIncomeStatements(ticker, period, displayCount) : Promise.resolve([]),
    wantRevenue && trailing ? getIncomeStatements(ticker, "quarter", displayCount + 4) : Promise.resolve([]),
    wantRevenue && !trailing ? getIncomeTtm(ticker) : Promise.resolve(null),
  ]);
  const currency = reportingCurrency(
    rows[0]?.reportedCurrency,
    quarterly[0]?.reportedCurrency,
    ttm?.reportedCurrency,
    reported[0]?.reportedCurrency,
  );
  let columns =
    source === "reported"
      ? asReportedColumns(reported, period)
      : trailing
        ? toTrailingColumns(quarterly, displayCount, CASH_TRAILING_SUM_KEYS)
        : withTtmColumn(ttm as Record<string, unknown> | null, toStatementColumns(rows, period));
  if (wantRevenue) {
    if (trailing) {
      const incomeTrailing = toTrailingColumns(incomeQuarters, displayCount, ["revenue"]);
      columns = mergeStatementValues(
        columns,
        incomeTrailing.map((column) => column.values),
        ["revenue"],
      );
    } else {
      columns = withRevenueBase(columns, income, incomeTtm?.revenue);
    }
  }

  return (
    <Container>
      <PageHeader
        title={`${ticker} Cash Flow Statement`}
        description={
          source === "reported"
            ? `As-reported XBRL line items from company filings. Figures in millions of ${currency}.`
            : view === "common-size"
              ? "Each cash-flow line is a percentage of revenue. Charts remain in dollars."
              : trailing
                ? `Rolling trailing-twelve-month cash flow. Each column sums four quarters. Figures in millions of ${currency}.`
                : `Operating, investing, and financing cash flows. Figures in millions of ${currency}.`
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
            {
              title: "Operating Cash Flow",
              items: statementChartItems(columns, "netCashProvidedByOperatingActivities"),
            },
            { title: "Free Cash Flow", items: statementChartItems(columns, "freeCashFlow") },
            {
              title: "Capital Expenditures",
              items: statementChartItems(columns, "investmentsInPropertyPlantAndEquipment"),
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
          caption={`Values in millions of ${currency}. Line labels follow the company's as-reported US-GAAP tags.`}
          downloadName={`${ticker}-cash-flow-as-reported-${period}-${span}`}
        />
      ) : (
        <StatementTable
          rows={withStatementHrefs(CASH_FLOW_ROWS, ticker)}
          columns={columns}
          scale="millions"
          currency={currency}
          commonSizeBase={view === "common-size" ? "revenue" : undefined}
          yoyOffset={trailing ? 4 : 1}
          caption={
            view === "common-size"
              ? "Percent of revenue from the matching income statement. Green/red year-over-year change is hidden in this view."
              : trailing
                ? `Values in millions of ${currency}. Green/red percentages compare each trailing window with the same quarter a year earlier.`
                : `Values in millions of ${currency}. The TTM column is trailing twelve months; green/red percentages are year-over-year change.`
          }
          downloadName={`${ticker}-cash-flow-${viewPeriod}-${span}${view === "common-size" ? "-common-size" : ""}`}
        />
      )}
    </Container>
  );
}
