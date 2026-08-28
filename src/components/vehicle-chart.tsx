import { Container } from "@/components/container";
import { PageHeader } from "@/components/page-header";
import { PriceChart } from "@/components/price-chart";
import { ReturnsTable } from "@/components/returns-table";
import { loadQuoteChart, canDividendAdjust } from "@/lib/chart";
import { getPriceChange, getQuote } from "@/lib/fmp";
import { decodeTicker } from "@/lib/listings";
import { vehiclePath, type VehicleKind } from "@/lib/vehicle";

export async function VehicleChart({
  symbol,
  range: rangeParam,
  adj: adjParam,
  kind,
}: {
  symbol: string;
  range?: string;
  adj?: string;
  kind: VehicleKind;
}) {
  const ticker = decodeTicker(symbol);
  const wantAdjusted = adjParam === "1" || adjParam === "true";
  const [chart, changes, quote] = await Promise.all([
    loadQuoteChart(ticker, rangeParam, { adjusted: wantAdjusted }),
    getPriceChange(ticker),
    getQuote(ticker),
  ]);
  const { range, points, ma50Series, ma200Series, ema12Series, ema26Series, rsiSeries, macdSeries, macdSignalSeries, macdHistogramSeries, adjusted } = chart;

  return (
    <Container>
      <PageHeader
        title={`${ticker} Chart`}
        description={
          adjusted
            ? "Dividend-adjusted closes from FMP, with SMA 50/200 computed on the adjusted series, plus EMA 12/26, RSI (14), and MACD (12, 26, 9)."
            : "Price history with SMA, EMA, RSI, MACD, and multi-period total returns."
        }
      />
      <PriceChart
        points={points}
        range={range}
        symbol={ticker}
        chartHref={vehiclePath(kind, ticker, "/chart")}
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
        showAdjustedToggle={canDividendAdjust(range)}
        query={wantAdjusted ? { adj: "1" } : undefined}
      />
      <ReturnsTable changes={changes} />
    </Container>
  );
}
