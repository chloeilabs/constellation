import { RatioMetricPage, periodFrom } from "@/components/ratio-metric-page";
import { decodeTicker } from "@/lib/listings";

export default async function CashRatioPage({
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
      slug="cash-ratio"
      title={`${ticker} Cash Ratio`}
      description="Cash and cash equivalents versus current liabilities."
      field="cashRatio"
      ttmField="cashRatioTTM"
      valueLabel="Cash Ratio"
      formula="Cash Ratio = Cash ÷ Current Liabilities"
    />
  );
}
