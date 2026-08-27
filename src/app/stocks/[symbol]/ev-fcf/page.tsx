import { RatioMetricPage, periodFrom } from "@/components/ratio-metric-page";
import { decodeTicker } from "@/lib/listings";

export default async function EvFcfPage({
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
      slug="ev-fcf"
      title={`${ticker} EV / FCF`}
      description="Enterprise value relative to trailing free cash flow."
      field="evToFreeCashFlow"
      ttmField="evToFreeCashFlowTTM"
      valueLabel="EV / FCF"
      formula="EV / FCF = Enterprise Value ÷ Free Cash Flow"
      source="metrics"
    />
  );
}
