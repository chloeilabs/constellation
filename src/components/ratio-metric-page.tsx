import { Container } from "@/components/container";
import { PageHeader } from "@/components/page-header";
import { SectionNav } from "@/components/section-nav";
import { quoteFundamentalsNav } from "@/lib/nav";
import { MetricCards } from "@/components/metric-cards";
import { MetricHistory } from "@/components/metric-history";
import { formatPercentPlain, formatRatio } from "@/lib/format";
import { getKeyMetrics, getKeyMetricsTtm, getRatios, getRatiosTtm } from "@/lib/fmp";
import { periodFrom } from "@/components/statement-metric-page";
import type { StatementPeriod } from "@/lib/types";

function num(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

export async function RatioMetricPage({
  symbol,
  period,
  slug,
  title,
  description,
  field,
  ttmField,
  valueLabel,
  formula,
  format = "ratio",
  source = "ratios",
}: {
  symbol: string;
  period: StatementPeriod;
  slug: string;
  title: string;
  description: string;
  field: string;
  ttmField: string;
  valueLabel: string;
  formula?: string;
  format?: "ratio" | "percent";
  source?: "ratios" | "metrics";
}) {
  const ticker = symbol.toUpperCase();
  const path = `/stocks/${ticker}/${slug}`;
  const [annual, quarterly, ttm] = await Promise.all(
    source === "metrics"
      ? [getKeyMetrics(ticker, "annual", 20), getKeyMetrics(ticker, "quarter", 12), getKeyMetricsTtm(ticker)]
      : [getRatios(ticker, "annual", 20), getRatios(ticker, "quarter", 12), getRatiosTtm(ticker)],
  );
  const history = period === "quarter" ? quarterly : annual;
  const latestTtm = num((ttm as Record<string, unknown> | null)?.[ttmField]);
  const formatValue = format === "percent" ? (value: number | null | undefined) => formatPercentPlain(value) : formatRatio;

  return (
    <Container>
      <PageHeader title={title} description={description} />
      <SectionNav items={quoteFundamentalsNav(ticker)} />
      <MetricCards items={[{ label: `${valueLabel} (ttm)`, value: formatValue(latestTtm) }]} />
      <MetricHistory
        period={period}
        annualHref={path}
        quarterHref={`${path}?period=quarter`}
        title={`${period === "quarter" ? "Quarterly" : "Annual"} ${valueLabel}`}
        valueLabel={valueLabel}
        formatValue={formatValue}
        empty={`No ${valueLabel.toLowerCase()} history available.`}
        rows={history.map((row) => ({
          key: `${row.date}-${row.period}`,
          date: row.date,
          label: period === "quarter" ? `${row.period} ${row.fiscalYear}` : String(row.fiscalYear),
          value: num(row[field]),
        }))}
      />
      {formula ? <p className="mt-4 text-sm text-muted">{formula}</p> : null}
    </Container>
  );
}

export { periodFrom };
