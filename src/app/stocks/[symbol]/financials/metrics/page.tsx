import { Container } from "@/components/container";
import { FinancialsNav } from "@/components/financials-nav";
import { PageHeader, PeriodToggle, YearToggle } from "@/components/page-header";
import { StatementTable } from "@/components/statement-table";
import { getKeyMetrics, getKeyMetricsTtm } from "@/lib/fmp";
import { reportingCurrency } from "@/lib/format";
import { decodeTicker, stockPath } from "@/lib/listings";
import { KEY_METRIC_ROWS, spanFrom, statementHref, statementLimit, stripTtmSuffix, toStatementColumns, withTtmColumn } from "@/lib/statements";
import type { StatementPeriod } from "@/lib/types";

export default async function MetricsPage({
  params,
  searchParams,
}: {
  params: Promise<{ symbol: string }>;
  searchParams: Promise<{ period?: string; years?: string }>;
}) {
  const { symbol } = await params;
  const { period: periodParam, years: yearsParam } = await searchParams;
  const ticker = decodeTicker(symbol);
  const period: StatementPeriod = periodParam === "quarter" ? "quarter" : "annual";
  const span = spanFrom(yearsParam);
  const [rows, ttm] = await Promise.all([getKeyMetrics(ticker, period, statementLimit(period, span)), getKeyMetricsTtm(ticker)]);
  const currency = reportingCurrency(rows[0]?.reportedCurrency);
  const base = stockPath(ticker, "/financials/metrics");

  return (
    <Container>
      <PageHeader
        title={`${ticker} Key Metrics`}
        description="Valuation, profitability, and efficiency metrics from FMP key-metrics."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <PeriodToggle
              period={period}
              annualHref={statementHref(base, "annual", "standardized", span)}
              quarterHref={statementHref(base, "quarter", "standardized", span)}
            />
            <YearToggle
              span={span}
              fiveHref={statementHref(base, period, "standardized", "5")}
              tenHref={statementHref(base, period, "standardized", "10")}
              maxHref={statementHref(base, period, "standardized", "max")}
            />
          </div>
        }
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
