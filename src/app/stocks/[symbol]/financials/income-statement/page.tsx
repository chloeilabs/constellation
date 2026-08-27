import { Container } from "@/components/container";
import { FinancialsNav } from "@/components/financials-nav";
import { PageHeader, StatementToolbar } from "@/components/page-header";
import { StatementCharts } from "@/components/statement-charts";
import { StatementTable } from "@/components/statement-table";
import { getIncomeAsReported, getIncomeStatements, getIncomeTtm } from "@/lib/fmp";
import { formatMillions, formatPrice, reportingCurrency } from "@/lib/format";
import { decodeTicker, stockPath } from "@/lib/listings";
import {
  INCOME_ROWS,
  asReportedColumns,
  asReportedStatementRows,
  sourceFrom,
  spanFrom,
  statementChartItems,
  statementLimit,
  statementToolbarHrefs,
  toStatementColumns,
  viewFrom,
  withTtmColumn,
} from "@/lib/statements";
import type { StatementPeriod } from "@/lib/types";

function periodFrom(value?: string): StatementPeriod {
  return value === "quarter" ? "quarter" : "annual";
}

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
  const period = periodFrom(periodParam);
  const source = sourceFrom(sourceParam);
  const span = spanFrom(yearsParam);
  const view = source === "reported" ? "dollars" : viewFrom(viewParam);
  const limit = statementLimit(period, span);
  const base = stockPath(ticker, "/financials/income-statement");
  const [rows, ttm, reported] = await Promise.all([
    source === "standardized" ? getIncomeStatements(ticker, period, limit) : Promise.resolve([]),
    source === "standardized" ? getIncomeTtm(ticker) : Promise.resolve(null),
    source === "reported" ? getIncomeAsReported(ticker, period, limit) : Promise.resolve([]),
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
        title={`${ticker} Income Statement`}
        description={
          source === "reported"
            ? `As-reported XBRL line items from company filings. Figures in millions of ${currency} except per-share items.`
            : view === "common-size"
              ? "Each income-statement line is a percentage of revenue. Charts remain in dollars."
              : `Revenue, expenses, and profitability. Figures in millions of ${currency} except per-share items.`
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
        />
      ) : (
        <StatementTable
          rows={INCOME_ROWS}
          columns={columns}
          scale="millions"
          currency={currency}
          commonSizeBase={view === "common-size" ? "revenue" : undefined}
          caption={
            view === "common-size"
              ? "Percent of revenue. EPS and share counts stay in original units. Green/red year-over-year change is hidden in this view."
              : `Values in millions of ${currency}. The TTM column is trailing twelve months; green/red percentages are year-over-year change.`
          }
        />
      )}
    </Container>
  );
}
