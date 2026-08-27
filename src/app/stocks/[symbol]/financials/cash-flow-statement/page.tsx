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
  asReportedColumns,
  asReportedStatementRows,
  sourceFrom,
  spanFrom,
  statementChartItems,
  statementLimit,
  statementToolbarHrefs,
  toStatementColumns,
  viewFrom,
  withRevenueBase,
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
  const period: StatementPeriod = periodParam === "quarter" ? "quarter" : "annual";
  const source = sourceFrom(sourceParam);
  const span = spanFrom(yearsParam);
  const view = source === "reported" ? "dollars" : viewFrom(viewParam);
  const limit = statementLimit(period, span);
  const base = stockPath(ticker, "/financials/cash-flow-statement");
  const wantRevenue = source === "standardized" && view === "common-size";
  const [rows, ttm, reported, income, incomeTtm] = await Promise.all([
    source === "standardized" ? getCashFlows(ticker, period, limit) : Promise.resolve([]),
    source === "standardized" ? getCashFlowTtm(ticker) : Promise.resolve(null),
    source === "reported" ? getCashFlowAsReported(ticker, period, limit) : Promise.resolve([]),
    wantRevenue ? getIncomeStatements(ticker, period, limit) : Promise.resolve([]),
    wantRevenue ? getIncomeTtm(ticker) : Promise.resolve(null),
  ]);
  const currency = reportingCurrency(
    rows[0]?.reportedCurrency,
    ttm?.reportedCurrency,
    reported[0]?.reportedCurrency,
  );
  const columns =
    source === "reported"
      ? asReportedColumns(reported, period)
      : withRevenueBase(
          withTtmColumn(ttm as Record<string, unknown> | null, toStatementColumns(rows, period)),
          income,
          incomeTtm?.revenue,
        );

  return (
    <Container>
      <PageHeader
        title={`${ticker} Cash Flow Statement`}
        description={
          source === "reported"
            ? `As-reported XBRL line items from company filings. Figures in millions of ${currency}.`
            : view === "common-size"
              ? "Each cash-flow line is a percentage of revenue. Charts remain in dollars."
              : `Operating, investing, and financing cash flows. Figures in millions of ${currency}.`
        }
        actions={
          <StatementToolbar
            period={period}
            source={source}
            span={span}
            view={view}
            {...statementToolbarHrefs(base, period, source, span, view)}
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
        />
      ) : (
        <StatementTable
          rows={CASH_FLOW_ROWS}
          columns={columns}
          scale="millions"
          currency={currency}
          commonSizeBase={view === "common-size" ? "revenue" : undefined}
          caption={
            view === "common-size"
              ? "Percent of revenue from the matching income statement. Green/red year-over-year change is hidden in this view."
              : `Values in millions of ${currency}. The TTM column is trailing twelve months; green/red percentages are year-over-year change.`
          }
        />
      )}
    </Container>
  );
}
