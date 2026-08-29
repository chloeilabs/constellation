import { Container } from "@/components/container";
import { PageHeader } from "@/components/page-header";
import { PriceChart } from "@/components/price-chart";
import { ReturnsTable } from "@/components/returns-table";
import { loadQuoteChart, loadVehiclePerformance, canDividendAdjust } from "@/lib/chart";
import { getPriceChange, getQuoteSafe, getProfile } from "@/lib/fmp";
import { indexDisplayName } from "@/lib/indexes";
import { decodeTicker } from "@/lib/listings";

export default async function ChartPage({
  params,
  searchParams,
}: {
  params: Promise<{ symbol: string }>;
  searchParams: Promise<{ range?: string; adj?: string }>;
}) {
  const { symbol } = await params;
  const { range: rangeParam, adj: adjParam } = await searchParams;
  const ticker = decodeTicker(symbol);
  const [chart, changes, quote, performance] = await Promise.all([
    loadQuoteChart(ticker, rangeParam, { adj: adjParam }),
    getPriceChange(ticker),
    getQuoteSafe(ticker),
    getProfile(ticker).then((company) => loadVehiclePerformance(ticker, company?.ipoDate ?? "1970-01-01")),
  ]);
  const { range, points, ma50Series, ma200Series, ema12Series, ema26Series, rsiSeries, macdSeries, macdSignalSeries, macdHistogramSeries, adjusted } = chart;
  const showAdjustedToggle = canDividendAdjust(range);

  return (
    <Container>
      <PageHeader
        title={`${indexDisplayName(ticker, quote?.name)} Chart`}
        description={
          adjusted
            ? "Dividend-adjusted closes from FMP, with SMA 50/200 computed on the adjusted series, plus EMA 12/26, RSI (14), and MACD (12, 26, 9)."
            : "Interactive historical price chart with SMA 50/200, EMA 12/26, RSI (14), and MACD (12, 26, 9)."
        }
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
        macdSeries={macdSeries}
        macdSignalSeries={macdSignalSeries}
        macdHistogramSeries={macdHistogramSeries}
        adjusted={adjusted}
        showAdjustedToggle={showAdjustedToggle}
        query={showAdjustedToggle && !adjusted ? { adj: "0" } : undefined}
      />
      <ReturnsTable changes={changes} performance={performance} />
    </Container>
  );
}
