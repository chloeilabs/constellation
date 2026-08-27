import { Container } from "@/components/container";
import { FinancialsNav } from "@/components/financials-nav";
import { PageHeader, PeriodToggle } from "@/components/page-header";
import { StatementTable } from "@/components/statement-table";
import { getCashFlows, getCashFlowTtm } from "@/lib/fmp";
import { reportingCurrency } from "@/lib/format";
import { decodeTicker, stockPath } from "@/lib/listings";
import { CASH_FLOW_ROWS, toStatementColumns, withTtmColumn } from "@/lib/statements";
import type { StatementPeriod } from "@/lib/types";

export default async function CashFlowPage({
  params,
  searchParams,
}: {
  params: Promise<{ symbol: string }>;
  searchParams: Promise<{ period?: string }>;
}) {
  const { symbol } = await params;
  const { period: periodParam } = await searchParams;
  const ticker = decodeTicker(symbol);
  const period: StatementPeriod = periodParam === "quarter" ? "quarter" : "annual";
  const [rows, ttm] = await Promise.all([getCashFlows(ticker, period, 8), getCashFlowTtm(ticker)]);
  const currency = reportingCurrency(rows[0]?.reportedCurrency, ttm?.reportedCurrency);
  const base = stockPath(ticker, "/financials/cash-flow-statement");

  return (
    <Container>
      <PageHeader
        title={`${ticker} Cash Flow Statement`}
        description={`Operating, investing, and financing cash flows. Figures in millions of ${currency}.`}
        actions={
          <PeriodToggle period={period} annualHref={base} quarterHref={`${base}?period=quarter`} />
        }
      />
      <FinancialsNav symbol={ticker} />
      <StatementTable
        rows={CASH_FLOW_ROWS}
        columns={withTtmColumn(ttm as Record<string, unknown> | null, toStatementColumns(rows, period))}
        scale="millions"
        currency={currency}
        caption={`Values in millions of ${currency}. The TTM column is trailing twelve months; green/red percentages are year-over-year change.`}
      />
    </Container>
  );
}
