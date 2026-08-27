import { Container } from "@/components/container";
import { FinancialsNav } from "@/components/financials-nav";
import { PageHeader, PeriodToggle } from "@/components/page-header";
import { StatementTable } from "@/components/statement-table";
import { getKeyMetrics, getKeyMetricsTtm } from "@/lib/fmp";
import { reportingCurrency } from "@/lib/format";
import { decodeTicker, stockPath } from "@/lib/listings";
import { KEY_METRIC_ROWS, stripTtmSuffix, toStatementColumns, withTtmColumn } from "@/lib/statements";
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
  const ticker = decodeTicker(symbol);
  const period: StatementPeriod = periodParam === "quarter" ? "quarter" : "annual";
  const [rows, ttm] = await Promise.all([getKeyMetrics(ticker, period, 8), getKeyMetricsTtm(ticker)]);
  const currency = reportingCurrency(rows[0]?.reportedCurrency);
  const base = stockPath(ticker, "/financials/metrics");

  return (
    <Container>
      <PageHeader
        title={`${ticker} Key Metrics`}
        description="Valuation, profitability, and efficiency metrics from FMP key-metrics."
        actions={<PeriodToggle period={period} annualHref={base} quarterHref={`${base}?period=quarter`} />}
      />
      <FinancialsNav symbol={ticker} />
      <StatementTable
        rows={KEY_METRIC_ROWS}
        columns={withTtmColumn(stripTtmSuffix(ttm as Record<string, unknown> | null), toStatementColumns(rows, period))}
        currency={currency}
        caption={`Amounts are shown in ${currency}. The TTM column uses trailing-twelve-month metrics.`}
      />
    </Container>
  );
}
