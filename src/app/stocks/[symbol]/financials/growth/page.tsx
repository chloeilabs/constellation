import { Container } from "@/components/container";
import { FinancialsNav } from "@/components/financials-nav";
import { PageHeader, PeriodToggle } from "@/components/page-header";
import { StatementTable } from "@/components/statement-table";
import { getFinancialGrowth } from "@/lib/fmp";
import { GROWTH_ROWS, toStatementColumns } from "@/lib/statements";
import type { StatementPeriod } from "@/lib/types";

export default async function GrowthPage({
  params,
  searchParams,
}: {
  params: Promise<{ symbol: string }>;
  searchParams: Promise<{ period?: string }>;
}) {
  const { symbol } = await params;
  const { period: periodParam } = await searchParams;
  const ticker = symbol.toUpperCase();
  const period: StatementPeriod = periodParam === "quarter" ? "quarter" : "annual";
  const rows = await getFinancialGrowth(ticker, period, 8);

  return (
    <Container>
      <PageHeader
        title={`${ticker} Financial Growth`}
        description="Income, cash flow, and per-share growth rates from FMP, including 3-, 5-, and 10-year figures."
        actions={
          <PeriodToggle
            period={period}
            annualHref={`/stocks/${ticker}/financials/growth`}
            quarterHref={`/stocks/${ticker}/financials/growth?period=quarter`}
          />
        }
      />
      <FinancialsNav symbol={ticker} />
      <StatementTable
        rows={GROWTH_ROWS}
        columns={toStatementColumns(rows, period)}
        caption="Period-over-period rates except 3/5/10-year per-share rows, which are cumulative."
      />
    </Container>
  );
}
