import { Container } from "@/components/container";
import { FinancialsNav } from "@/components/financials-nav";
import { PageHeader, PeriodToggle } from "@/components/page-header";
import { StatementTable } from "@/components/statement-table";
import { getKeyMetrics } from "@/lib/fmp";
import { KEY_METRIC_ROWS, toStatementColumns } from "@/lib/statements";
import type { StatementPeriod } from "@/lib/types";

export default async function MetricsPage({
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
  const rows = await getKeyMetrics(ticker, period, 8);

  return (
    <Container>
      <PageHeader
        title={`${ticker} Key Metrics`}
        description="Valuation, profitability, and efficiency metrics from FMP key-metrics."
        actions={
          <PeriodToggle
            period={period}
            annualHref={`/stocks/${ticker}/financials/metrics`}
            quarterHref={`/stocks/${ticker}/financials/metrics?period=quarter`}
          />
        }
      />
      <FinancialsNav symbol={ticker} />
      <StatementTable
        rows={KEY_METRIC_ROWS}
        columns={toStatementColumns(rows, period)}
        caption="Dollar amounts are shown in full. Ratios, yields, and day counts are unscaled."
      />
    </Container>
  );
}
