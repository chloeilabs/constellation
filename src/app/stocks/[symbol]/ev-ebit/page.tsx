import { RatioMetricPage, periodFrom } from "@/components/ratio-metric-page";
import { decodeTicker } from "@/lib/listings";

export default async function EvEbitPage({
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
      slug="ev-ebit"
      title={`${ticker} EV / EBIT`}
      description="Enterprise value relative to EBIT, using period-end close and net cash from filings (cash includes marketable securities)."
      field="evToEBIT"
      ttmField="evToEBITTTM"
      valueLabel="EV / EBIT"
      formula="EV / EBIT = Enterprise Value ÷ EBIT"
      source="metrics"
      priceBased
    />
  );
}
