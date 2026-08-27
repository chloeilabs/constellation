import { Container } from "@/components/container";
import { PageHeader } from "@/components/page-header";
import { PriceChart } from "@/components/price-chart";
import { ReturnsTable } from "@/components/returns-table";
import { loadQuoteChart } from "@/lib/chart";
import { getPriceChange, getQuote } from "@/lib/fmp";
import { decodeTicker } from "@/lib/listings";
import { vehiclePath, type VehicleKind } from "@/lib/vehicle";

export async function VehicleChart({
  symbol,
  range: rangeParam,
  kind,
}: {
  symbol: string;
  range?: string;
  kind: VehicleKind;
}) {
  const ticker = decodeTicker(symbol);
  const [chart, changes, quote] = await Promise.all([
    loadQuoteChart(ticker, rangeParam),
    getPriceChange(ticker),
    getQuote(ticker),
  ]);
  const { range, points, ma50Series, ma200Series } = chart;

  return (
    <Container>
      <PageHeader title={`${ticker} Chart`} description="Price history and multi-period total returns." />
      <PriceChart
        points={points}
        range={range}
        symbol={ticker}
        chartHref={vehiclePath(kind, ticker, "/chart")}
        ma50={quote?.priceAvg50}
        ma200={quote?.priceAvg200}
        ma50Series={ma50Series}
        ma200Series={ma200Series}
      />
      <ReturnsTable changes={changes} />
    </Container>
  );
}
