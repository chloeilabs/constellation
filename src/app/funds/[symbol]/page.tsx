import { Suspense } from "react";
import { Container } from "@/components/container";
import { NewsList } from "@/components/news-list";
import { PriceChart } from "@/components/price-chart";
import { ReturnsTable } from "@/components/returns-table";
import { StatGrid } from "@/components/quote-stats";
import { formatCompactUsd, formatDate, formatInteger, formatPercentPlain, formatPrice, formatRatio } from "@/lib/format";
import { CHART_RANGES, getChartData, type ChartRange } from "@/lib/chart";
import { getPriceChange, getProfile, getQuote, getSymbolNews } from "@/lib/fmp";

export default async function FundQuotePage({
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
  const [quote, profile, news, points, priceChange] = await Promise.all([
    getQuote(ticker),
    getProfile(ticker),
    getSymbolNews(ticker, 8),
    getChartData(ticker, range),
    getPriceChange(ticker),
  ]);
  const yieldValue =
    profile?.lastDividend && (quote?.price ?? profile.price)
      ? profile.lastDividend / (quote?.price ?? profile.price)
      : null;

  return (
    <Container>
      <div className="mb-8">
        <Suspense fallback={<div className="h-[320px] animate-pulse rounded-lg bg-muted-bg" />}>
          <PriceChart points={points} range={range} symbol={ticker} />
        </Suspense>
        <ReturnsTable changes={priceChange} />
      </div>
      {profile?.description ? (
        <p className="mb-8 max-w-4xl text-sm leading-7 text-header/90">{profile.description}</p>
      ) : null}
      <div className="grid gap-6 lg:grid-cols-2">
        <StatGrid
          items={[
            { label: "Net Assets", value: formatCompactUsd(quote?.marketCap ?? profile?.marketCap) },
            { label: "NAV / Price", value: formatPrice(quote?.price ?? profile?.price) },
            { label: "Dividend (ttm)", value: profile?.lastDividend ? `$${formatPrice(profile.lastDividend)}` : "—" },
            { label: "Yield", value: formatPercentPlain(yieldValue) },
            { label: "Beta", value: formatRatio(profile?.beta) },
            { label: "Inception / IPO", value: formatDate(profile?.ipoDate) },
          ]}
        />
        <StatGrid
          items={[
            { label: "Open", value: formatPrice(quote?.open) },
            { label: "Previous Close", value: formatPrice(quote?.previousClose) },
            { label: "Day's Range", value: quote ? `${formatPrice(quote.dayLow)} - ${formatPrice(quote.dayHigh)}` : "—" },
            { label: "52-Week Range", value: quote ? `${formatPrice(quote.yearLow)} - ${formatPrice(quote.yearHigh)}` : "—" },
            { label: "50-Day Average", value: formatPrice(quote?.priceAvg50) },
            { label: "200-Day Average", value: formatPrice(quote?.priceAvg200) },
            { label: "Volume", value: formatInteger(quote?.volume ?? profile?.volume) },
            { label: "Average Volume", value: formatInteger(quote?.avgVolume ?? profile?.averageVolume) },
          ]}
        />
      </div>
      <section className="mt-10">
        <h2 className="mb-3 text-xl font-semibold text-header">News</h2>
        <NewsList items={news} showSymbol={false} />
      </section>
    </Container>
  );
}
