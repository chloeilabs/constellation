import { RatioMetricPage, periodFrom } from "@/components/ratio-metric-page";
import { decodeTicker } from "@/lib/listings";

export default async function EvSalesPage({
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
      slug="ev-sales"
      title={`${ticker} EV / Sales`}
      description="Enterprise value relative to trailing revenue, using period-end close and net cash from filings."
      field="evToSales"
      ttmField="evToSalesTTM"
      valueLabel="EV / Sales"
      formula="EV / Sales = Enterprise Value ÷ Revenue"
      source="metrics"
      priceBased
    />
  );
}
