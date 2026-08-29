import { RatioMetricPage, periodFrom } from "@/components/ratio-metric-page";
import { decodeTicker } from "@/lib/listings";

export default async function FcfYieldPage({
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
      slug="fcf-yield"
      title={`${ticker} FCF Yield`}
      description="Trailing free cash flow as a percentage of market cap. Fiscal history uses the last close on or before each period end."
      field="freeCashFlowYield"
      ttmField="freeCashFlowYieldTTM"
      valueLabel="FCF Yield"
      formula="FCF Yield = Free Cash Flow ÷ Market Cap"
      format="percent"
      priceBased
    />
  );
}
