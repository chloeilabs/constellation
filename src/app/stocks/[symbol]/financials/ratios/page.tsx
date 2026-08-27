import { Container } from "@/components/container";
import { FinancialsNav } from "@/components/financials-nav";
import { PageHeader, PeriodToggle } from "@/components/page-header";
import { StatementTable } from "@/components/statement-table";
import { getRatios } from "@/lib/fmp";
import { RATIO_ROWS, toStatementColumns } from "@/lib/statements";
import type { StatementPeriod } from "@/lib/types";

export default async function RatiosPage({
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
  const rows = await getRatios(ticker, period, 8);

  return (
    <Container>
      <PageHeader
        title={`${ticker} Financial Ratios`}
        description="Profitability, liquidity, leverage, and valuation ratios."
        actions={
          <PeriodToggle
            period={period}
            annualHref={`/stocks/${ticker}/financials/ratios`}
            quarterHref={`/stocks/${ticker}/financials/ratios?period=quarter`}
          />
        }
      />
      <FinancialsNav symbol={ticker} />
      <StatementTable rows={RATIO_ROWS} columns={toStatementColumns(rows, period)} />
    </Container>
  );
}
