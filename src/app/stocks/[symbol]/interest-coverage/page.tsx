import { RatioMetricPage, periodFrom } from "@/components/ratio-metric-page";
import { decodeTicker } from "@/lib/listings";

export default async function InterestCoveragePage({
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
    <RatioMetricPage
      symbol={ticker}
      period={periodFrom(periodParam)}
      slug="interest-coverage"
      title={`${ticker} Interest Coverage`}
      description="EBIT divided by interest expense from FMP filings. Zero or missing coverage is shown as unavailable."
      field="interestCoverageRatio"
      ttmField="interestCoverageRatioTTM"
      valueLabel="Interest Coverage"
      formula="Interest Coverage = EBIT ÷ Interest Expense"
      zeroAsEmpty
      priceBased
    />
  );
}
