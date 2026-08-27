import { Container } from "@/components/container";
import { PageHeader } from "@/components/page-header";
import { PriceChart } from "@/components/price-chart";
import { ReturnsTable } from "@/components/returns-table";
import { loadQuoteChart } from "@/lib/chart";
import { getPriceChange, getQuoteSafe } from "@/lib/fmp";
import { indexDisplayName } from "@/lib/indexes";
import { decodeTicker } from "@/lib/listings";

export default async function ChartPage({
  params,
  searchParams,
}: {
  params: Promise<{ symbol: string }>;
  searchParams: Promise<{ range?: string }>;
}) {
  const { symbol } = await params;
  const { range: rangeParam } = await searchParams;
  const ticker = decodeTicker(symbol);
  const [chart, changes, quote] = await Promise.all([
    loadQuoteChart(ticker, rangeParam),
    getPriceChange(ticker),
    getQuoteSafe(ticker),
  ]);
  const { range, points, ma50Series, ma200Series, ema12Series, ema26Series, rsiSeries } = chart;

  return (
    <Container>
      <PageHeader
        title={`${indexDisplayName(ticker, quote?.name)} Chart`}
        description="Interactive historical price chart with SMA 50/200, EMA 12/26, and RSI (14)."
      />
      <PriceChart
        points={points}
        range={range}
        symbol={ticker}
        ma50={quote?.priceAvg50}
        ma200={quote?.priceAvg200}
        ma50Series={ma50Series}
        ma200Series={ma200Series}
        ema12Series={ema12Series}
        ema26Series={ema26Series}
        rsiSeries={rsiSeries}
      />
      <ReturnsTable changes={changes} />
    </Container>
  );
}
