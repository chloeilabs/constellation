import { Container } from "@/components/container";
import { PageHeader } from "@/components/page-header";
import { PriceChart } from "@/components/price-chart";
import { ReturnsTable } from "@/components/returns-table";
import { CHART_RANGES, getChartData, type ChartRange } from "@/lib/chart";
import { getPriceChange, getQuote } from "@/lib/fmp";

export default async function EtfChartPage({
  params,
  searchParams,
}: {
  params: Promise<{ symbol: string }>;
  searchParams: Promise<{ range?: string }>;
}) {
  const { symbol } = await params;
  const { range: rangeParam } = await searchParams;
  const ticker = symbol.toUpperCase();
  const range = CHART_RANGES.includes(rangeParam as ChartRange) ? (rangeParam as ChartRange) : "1Y";
  const [points, changes, quote] = await Promise.all([
    getChartData(ticker, range),
    getPriceChange(ticker),
    getQuote(ticker),
  ]);

  return (
    <Container>
      <PageHeader title={`${ticker} Chart`} description="Price history and multi-period total returns." />
      <PriceChart
        points={points}
        range={range}
        symbol={ticker}
        chartHref={`/etf/${ticker}/chart`}
        ma50={quote?.priceAvg50}
        ma200={quote?.priceAvg200}
      />
      <ReturnsTable changes={changes} />
    </Container>
  );
}
