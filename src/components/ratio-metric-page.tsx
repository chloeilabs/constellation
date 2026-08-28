import { Container } from "@/components/container";
import { PageHeader } from "@/components/page-header";
import { SectionNav } from "@/components/section-nav";
import { quoteFundamentalsNav } from "@/lib/nav";
import { MetricCards } from "@/components/metric-cards";
import { MetricHistory } from "@/components/metric-history";
import { formatCompactUsd, formatNumber, formatPercentPlain, formatRatio } from "@/lib/format";
import { decodeTicker, stockPath } from "@/lib/listings";
import { historyLabel, loadLiveValuation, loadPeriodValuationHistory } from "@/lib/period-valuation";
import { periodFrom } from "@/components/statement-metric-page";
import { filingLimit } from "@/lib/statements";
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
  zeroAsEmpty = false,
}: {
  symbol: string;
  period: StatementPeriod;
  slug: string;
  title: string;
  description: string;
  field: string;
  ttmField?: string;
  valueLabel: string;
  formula?: string;
  format?: "ratio" | "percent" | "money" | "days";
  source?: "ratios" | "metrics";
  zeroAsEmpty?: boolean;
  priceBased?: boolean;
}) {
  const ticker = decodeTicker(symbol);
  const path = stockPath(ticker, `/${slug}`);
  const limit = filingLimit(period);
  const [historyRows, live] = await Promise.all([
    loadPeriodValuationHistory(ticker, period, limit),
    loadLiveValuation(ticker),
  ]);
  const liveRecord = live as Record<string, unknown>;
  const latestTtm = num(liveRecord[field]) ?? (ttmField ? num(liveRecord[ttmField]) : null);
  const display = (value: number | null) => (zeroAsEmpty && value === 0 ? null : value);
  const formatValue = (value: number | null | undefined) => {
    const shown = display(num(value));
    if (format === "percent") return formatPercentPlain(shown);
    if (format === "money") return formatCompactUsd(shown);
    if (format === "days") return shown == null ? "—" : `${formatNumber(shown, 1)} days`;
    return formatRatio(shown);
  };

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
        rows={historyRows.map((row) => ({
          key: `${row.date}-${"period" in row ? row.period : period}`,
          date: row.date,
          label: historyLabel(row, period),
          value: display(num((row as Record<string, unknown>)[field])),
        }))}
      />
      {formula ? <p className="mt-4 text-sm text-muted">{formula}</p> : null}
    </Container>
  );
}

export { periodFrom };
