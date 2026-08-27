import { Container } from "@/components/container";
import { FinancialsNav } from "@/components/financials-nav";
import { PageHeader, PeriodToggle } from "@/components/page-header";
import { StatementTable } from "@/components/statement-table";
import { getIncomeStatements, getIncomeTtm } from "@/lib/fmp";
import { reportingCurrency } from "@/lib/format";
import { decodeTicker, stockPath } from "@/lib/listings";
import { INCOME_ROWS, toStatementColumns, withTtmColumn } from "@/lib/statements";
import type { StatementPeriod } from "@/lib/types";

function periodFrom(value?: string): StatementPeriod {
  return value === "quarter" ? "quarter" : "annual";
}

export default async function IncomeStatementPage({
  params,
  searchParams,
}: {
  params: Promise<{ symbol: string }>;
  searchParams: Promise<{ period?: string }>;
}) {
  const { symbol } = await params;
  const { period: periodParam } = await searchParams;
  const ticker = decodeTicker(symbol);
  const period = periodFrom(periodParam);
  const [rows, ttm] = await Promise.all([getIncomeStatements(ticker, period, 8), getIncomeTtm(ticker)]);
  const currency = reportingCurrency(rows[0]?.reportedCurrency, ttm?.reportedCurrency);
  const base = stockPath(ticker, "/financials/income-statement");

  return (
    <Container>
      <PageHeader
        title={`${ticker} Income Statement`}
        description={`Revenue, expenses, and profitability. Figures in millions of ${currency} except per-share items.`}
        actions={
          <PeriodToggle period={period} annualHref={base} quarterHref={`${base}?period=quarter`} />
        }
      />
      <FinancialsNav symbol={ticker} />
      <StatementTable
        rows={INCOME_ROWS}
        columns={withTtmColumn(ttm as Record<string, unknown> | null, toStatementColumns(rows, period))}
        scale="millions"
        currency={currency}
        caption={`Values in millions of ${currency}. The TTM column is trailing twelve months; green/red percentages are year-over-year change.`}
      />
    </Container>
  );
}
