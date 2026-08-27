import { Container } from "@/components/container";
import { FinancialsNav } from "@/components/financials-nav";
import { PageHeader, StatementToolbar } from "@/components/page-header";
import { StatementCharts } from "@/components/statement-charts";
import { StatementTable } from "@/components/statement-table";
import { getCashFlowAsReported, getCashFlows, getCashFlowTtm } from "@/lib/fmp";
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
  withTtmColumn,
} from "@/lib/statements";
import type { StatementPeriod } from "@/lib/types";

export default async function CashFlowPage({
  params,
  searchParams,
}: {
  params: Promise<{ symbol: string }>;
  searchParams: Promise<{ period?: string; source?: string; years?: string }>;
}) {
  const { symbol } = await params;
  const { period: periodParam, source: sourceParam, years: yearsParam } = await searchParams;
  const ticker = decodeTicker(symbol);
  const period: StatementPeriod = periodParam === "quarter" ? "quarter" : "annual";
  const source = sourceFrom(sourceParam);
  const span = spanFrom(yearsParam);
  const limit = statementLimit(period, span);
  const base = stockPath(ticker, "/financials/cash-flow-statement");
  const [rows, ttm, reported] = await Promise.all([
    source === "standardized" ? getCashFlows(ticker, period, limit) : Promise.resolve([]),
    source === "standardized" ? getCashFlowTtm(ticker) : Promise.resolve(null),
    source === "reported" ? getCashFlowAsReported(ticker, period, limit) : Promise.resolve([]),
  ]);
  const currency = reportingCurrency(
    rows[0]?.reportedCurrency,
    ttm?.reportedCurrency,
    reported[0]?.reportedCurrency,
  );
  const columns =
    source === "reported"
      ? asReportedColumns(reported, period)
      : withTtmColumn(ttm as Record<string, unknown> | null, toStatementColumns(rows, period));

  return (
    <Container>
      <PageHeader
        title={`${ticker} Cash Flow Statement`}
        description={
          source === "reported"
            ? `As-reported XBRL line items from company filings. Figures in millions of ${currency}.`
            : `Operating, investing, and financing cash flows. Figures in millions of ${currency}.`
        }
        actions={
          <StatementToolbar
            period={period}
            source={source}
            span={span}
            {...statementToolbarHrefs(base, period, source, span)}
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
          caption={`Values in millions of ${currency}. The TTM column is trailing twelve months; green/red percentages are year-over-year change.`}
        />
      )}
    </Container>
  );
}
