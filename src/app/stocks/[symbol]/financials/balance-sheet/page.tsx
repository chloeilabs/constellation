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
  statementChartItems,
  statementHref,
  toStatementColumns,
  withTtmColumn,
} from "@/lib/statements";
import type { StatementPeriod } from "@/lib/types";

export default async function BalanceSheetPage({
  params,
  searchParams,
}: {
  params: Promise<{ symbol: string }>;
  searchParams: Promise<{ period?: string; source?: string }>;
}) {
  const { symbol } = await params;
  const { period: periodParam, source: sourceParam } = await searchParams;
  const ticker = decodeTicker(symbol);
  const period: StatementPeriod = periodParam === "quarter" ? "quarter" : "annual";
  const source = sourceFrom(sourceParam);
  const base = stockPath(ticker, "/financials/balance-sheet");
  const [rows, ttm, reported] = await Promise.all([
    source === "standardized" ? getBalanceSheets(ticker, period, 8) : Promise.resolve([]),
    source === "standardized" ? getBalanceSheetTtm(ticker) : Promise.resolve(null),
    source === "reported" ? getBalanceAsReported(ticker, period, 8) : Promise.resolve([]),
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
            : `Assets, liabilities, and shareholders' equity. Figures in millions of ${currency}.`
        }
        actions={
          <StatementToolbar
            period={period}
            source={source}
            annualHref={statementHref(base, "annual", source)}
            quarterHref={statementHref(base, "quarter", source)}
            standardizedHref={statementHref(base, period, "standardized")}
            reportedHref={statementHref(base, period, "reported")}
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
        />
      ) : (
        <StatementTable
          rows={BALANCE_ROWS}
          columns={columns}
          scale="millions"
          currency={currency}
          caption={`Values in millions of ${currency}. The TTM column is the latest trailing snapshot; green/red percentages are year-over-year change.`}
        />
      )}
    </Container>
  );
}
