import { RatioMetricPage, periodFrom } from "@/components/ratio-metric-page";
import { decodeTicker } from "@/lib/listings";

export default async function DividendYieldPage({
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
      slug="dividend-yield"
      title={`${ticker} Dividend Yield`}
      description="Trailing dividend payments as a percentage of share price, from live FMP ratio statements."
      field="dividendYield"
      ttmField="dividendYieldTTM"
      valueLabel="Dividend Yield"
      formula="Dividend Yield = Annual Dividends Per Share ÷ Price"
      format="percent"
    />
  );
}
