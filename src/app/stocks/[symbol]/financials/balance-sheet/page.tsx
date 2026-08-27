import { Container } from "@/components/container";
import { FinancialsNav } from "@/components/financials-nav";
import { PageHeader, StatementToolbar } from "@/components/page-header";
import { StatementCharts } from "@/components/statement-charts";
import { StatementTable } from "@/components/statement-table";
import { getBalanceAsReported, getBalanceSheets, getBalanceSheetTtm } from "@/lib/fmp";
import { formatMillions, reportingCurrency } from "@/lib/format";
import { decodeTicker, stockPath } from "@/lib/listings";
import {
  BALANCE_ROWS,
  asReportedColumns,
  asReportedStatementRows,
  sourceFrom,
  spanFrom,
  statementChartItems,
  statementLimit,
  statementToolbarHrefs,
  toStatementColumns,
  viewFrom,
  withStatementHrefs,
  withTtmColumn,
} from "@/lib/statements";
import type { StatementPeriod } from "@/lib/types";

export default async function BalanceSheetPage({
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
  const base = stockPath(ticker, "/financials/balance-sheet");
  const [rows, ttm, reported] = await Promise.all([
    source === "standardized" ? getBalanceSheets(ticker, period, limit) : Promise.resolve([]),
    source === "standardized" ? getBalanceSheetTtm(ticker) : Promise.resolve(null),
    source === "reported" ? getBalanceAsReported(ticker, period, limit) : Promise.resolve([]),
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
        title={`${ticker} Balance Sheet`}
        description={
          source === "reported"
            ? `As-reported XBRL line items from company filings. Figures in millions of ${currency}.`
            : view === "common-size"
              ? "Each balance-sheet line is a percentage of total assets. Charts remain in dollars."
              : `Assets, liabilities, and shareholders' equity. Figures in millions of ${currency}.`
        }
        actions={
          <StatementToolbar
            period={period}
            source={source}
            span={span}
            view={view}
            {...statementToolbarHrefs(base, period, source, span, view, { trailing: false })}
          />
        }
      />
      <FinancialsNav symbol={ticker} />
      {source === "standardized" ? (
        <StatementCharts
          formatValue={formatMillions}
          series={[
            { title: "Total Assets", items: statementChartItems(columns, "totalAssets") },
            { title: "Total Debt", items: statementChartItems(columns, "totalDebt") },
            { title: "Shareholders' Equity", items: statementChartItems(columns, "totalStockholdersEquity") },
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
          downloadName={`${ticker}-balance-as-reported-${period}-${span}`}
        />
      ) : (
        <StatementTable
          rows={withStatementHrefs(BALANCE_ROWS, ticker)}
          columns={columns}
          scale="millions"
          currency={currency}
          commonSizeBase={view === "common-size" ? "totalAssets" : undefined}
          caption={
            view === "common-size"
              ? "Percent of total assets. Green/red year-over-year change is hidden in this view."
              : `Values in millions of ${currency}. The TTM column is the latest trailing snapshot; green/red percentages are year-over-year change.`
          }
          downloadName={`${ticker}-balance-${period}-${span}${view === "common-size" ? "-common-size" : ""}`}
        />
      )}
    </Container>
  );
}
