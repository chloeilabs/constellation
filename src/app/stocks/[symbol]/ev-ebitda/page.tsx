import { RatioMetricPage, periodFrom } from "@/components/ratio-metric-page";
import { decodeTicker } from "@/lib/listings";

export default async function EvEbitdaPage({
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
      slug="ev-ebitda"
      title={`${ticker} EV / EBITDA`}
      description="Enterprise value relative to trailing EBITDA, using period-end close and net cash from filings."
      field="evToEBITDA"
      ttmField="evToEBITDATTM"
      valueLabel="EV / EBITDA"
      formula="EV / EBITDA = Enterprise Value ÷ EBITDA"
      source="metrics"
      priceBased
    />
  );
}
