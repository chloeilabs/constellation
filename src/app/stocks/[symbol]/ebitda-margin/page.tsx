import { StatementMetricPage, periodFrom } from "@/components/statement-metric-page";
import { decodeTicker } from "@/lib/listings";

export default async function EbitdaMarginPage({
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
      slug="ebitda-margin"
      title={`${ticker} EBITDA Margin`}
      description="EBIT plus depreciation and amortization, as a percentage of revenue."
      field="ebitdaMargin"
      ttmField="ebitdaMargin"
      kind="income"
      format="percent"
      formula="EBITDA Margin = (Operating Income + D&A) ÷ Revenue"
    />
  );
}
