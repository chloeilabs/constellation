import { StatementMetricPage, periodFrom } from "@/components/statement-metric-page";
import { decodeTicker } from "@/lib/listings";

export default async function EbitMarginPage({
  params,
  searchParams,
}: {
  params: Promise<{ symbol: string }>;
  searchParams: Promise<{ period?: string }>;
}) {
  const { symbol } = await params;
  const { period: periodParam } = await searchParams;
  const ticker = decodeTicker(symbol);
  return (
    <StatementMetricPage
      symbol={ticker}
      period={periodFrom(periodParam)}
      slug="ebit-margin"
      title={`${ticker} EBIT Margin`}
      description="Operating income (EBIT) as a percentage of revenue."
      field="ebitMargin"
      ttmField="ebitMargin"
      kind="income"
      format="percent"
      formula="EBIT Margin = Operating Income ÷ Revenue"
    />
  );
}
