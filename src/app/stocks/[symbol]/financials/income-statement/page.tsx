import { Container } from "@/components/container";
import { FinancialsNav } from "@/components/financials-nav";
import { PageHeader, StatementToolbar } from "@/components/page-header";
import { StatementTable } from "@/components/statement-table";
import { getIncomeAsReported, getIncomeStatements, getIncomeTtm } from "@/lib/fmp";
import { reportingCurrency } from "@/lib/format";
import { decodeTicker, stockPath } from "@/lib/listings";
import {
  INCOME_ROWS,
  asReportedColumns,
  asReportedStatementRows,
  sourceFrom,
  statementHref,
  toStatementColumns,
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
  searchParams: Promise<{ period?: string; source?: string }>;
}) {
  const { symbol } = await params;
  const { period: periodParam, source: sourceParam } = await searchParams;
  const ticker = decodeTicker(symbol);
  const period = periodFrom(periodParam);
  const source = sourceFrom(sourceParam);
  const base = stockPath(ticker, "/financials/income-statement");
  const [rows, ttm, reported] = await Promise.all([
    source === "standardized" ? getIncomeStatements(ticker, period, 8) : Promise.resolve([]),
    source === "standardized" ? getIncomeTtm(ticker) : Promise.resolve(null),
    source === "reported" ? getIncomeAsReported(ticker, period, 8) : Promise.resolve([]),
  ]);
  const currency = reportingCurrency(
    rows[0]?.reportedCurrency,
    ttm?.reportedCurrency,
    reported[0]?.reportedCurrency,
  );

  return (
    <Container>
      <PageHeader
        title={`${ticker} Income Statement`}
        description={
          source === "reported"
            ? `As-reported XBRL line items from company filings. Figures in millions of ${currency} except per-share items.`
            : `Revenue, expenses, and profitability. Figures in millions of ${currency} except per-share items.`
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
      {source === "reported" ? (
        <StatementTable
          rows={asReportedStatementRows(reported)}
          columns={asReportedColumns(reported, period)}
          scale="millions"
          currency={currency}
          caption={`Values in millions of ${currency}. Line labels follow the company's as-reported US-GAAP tags, not FMP's standardized statement.`}
        />
      ) : (
        <StatementTable
          rows={INCOME_ROWS}
          columns={withTtmColumn(ttm as Record<string, unknown> | null, toStatementColumns(rows, period))}
          scale="millions"
          currency={currency}
          caption={`Values in millions of ${currency}. The TTM column is trailing twelve months; green/red percentages are year-over-year change.`}
        />
      )}
    </Container>
  );
}
