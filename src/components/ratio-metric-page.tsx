import { Container } from "@/components/container";
import { PageHeader } from "@/components/page-header";
import { SectionNav } from "@/components/section-nav";
import { quoteFundamentalsNav } from "@/lib/nav";
import { MetricCards } from "@/components/metric-cards";
import { MetricHistory } from "@/components/metric-history";
import { formatRatio } from "@/lib/format";
import { getRatios, getRatiosTtm } from "@/lib/fmp";
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
}) {
  const ticker = symbol.toUpperCase();
  const path = `/stocks/${ticker}/${slug}`;
  const [annual, quarterly, ttm] = await Promise.all([
    getRatios(ticker, "annual", 20),
    getRatios(ticker, "quarter", 12),
    getRatiosTtm(ticker),
  ]);
  const history = period === "quarter" ? quarterly : annual;
  const latestTtm = num((ttm as Record<string, unknown> | null)?.[ttmField]);

  return (
    <Container>
      <PageHeader title={title} description={description} />
      <SectionNav items={quoteFundamentalsNav(ticker)} />
      <MetricCards items={[{ label: `${valueLabel} (ttm)`, value: formatRatio(latestTtm) }]} />
      <MetricHistory
        period={period}
        annualHref={path}
        quarterHref={`${path}?period=quarter`}
        title={`${period === "quarter" ? "Quarterly" : "Annual"} ${valueLabel}`}
        valueLabel={valueLabel}
        formatValue={formatRatio}
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
