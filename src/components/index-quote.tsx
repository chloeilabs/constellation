import Link from "next/link";
import { Container } from "@/components/container";
import { NewsList } from "@/components/news-list";
import { PriceChart } from "@/components/price-chart";
import { StatGrid } from "@/components/quote-stats";
import { ReturnsTable } from "@/components/returns-table";
import { SymbolTable } from "@/components/symbol-table";
import { ChangePercent } from "@/components/change";
import { formatCompact, formatInteger, formatPrice } from "@/lib/format";
import { getChartData, type ChartRange } from "@/lib/chart";
import { getPriceChange, getQuoteSafe, getStockNews } from "@/lib/fmp";
import { indexConstituentMeta, indexDisplayName } from "@/lib/indexes";
import { stockPath } from "@/lib/listings";
import { loadIndexMembers } from "@/lib/lists";

export async function IndexQuote({ ticker, range }: { ticker: string; range: ChartRange }) {
  const name = indexDisplayName(ticker);
  const meta = indexConstituentMeta(ticker);
  const [quote, points, priceChange, news, members] = await Promise.all([
    getQuoteSafe(ticker),
    getChartData(ticker, range),
    getPriceChange(ticker),
    getStockNews(8),
    meta ? loadIndexMembers(meta.fmpIndex) : Promise.resolve(null),
  ]);
  const level = quote?.price;
  const changePct = quote?.changePercentage;
  const topMembers = members?.rows.slice(0, 15) ?? [];

  return (
    <Container>
      <p className="mb-6 max-w-4xl text-sm leading-7 text-header/90">
        The {name} ({ticker}) is at {formatPrice(level)}
        {typeof changePct === "number" ? (
          <>
            {" "}
            (<ChangePercent value={changePct} />)
          </>
        ) : null}
        .{" "}
        {meta
          ? `Constituents are the ${meta.label} members from FMP, ranked by market cap.`
          : "FMP does not publish a constituent file for this index."}
      </p>

      <div className="grid gap-8 xl:grid-cols-[minmax(0,1.65fr)_minmax(280px,24rem)]">
        <div>
          <PriceChart
            points={points}
            range={range}
            symbol={ticker}
            chartHref={stockPath(ticker, "/chart")}
            ma50={quote?.priceAvg50}
            ma200={quote?.priceAvg200}
          />
          <ReturnsTable changes={priceChange} />
        </div>
        <StatGrid
          items={[
            { label: "Level", value: formatPrice(level) },
            { label: "Change", value: <ChangePercent value={quote?.changePercentage} /> },
            { label: "Open", value: formatPrice(quote?.open) },
            { label: "Previous Close", value: formatPrice(quote?.previousClose) },
            {
              label: "Day Range",
              value:
                quote?.dayLow != null && quote?.dayHigh != null
                  ? `${formatPrice(quote.dayLow)} – ${formatPrice(quote.dayHigh)}`
                  : "—",
            },
            {
              label: "52 Week Range",
              value:
                quote?.yearLow != null && quote?.yearHigh != null
                  ? `${formatPrice(quote.yearLow)} – ${formatPrice(quote.yearHigh)}`
                  : "—",
            },
            { label: "Volume", value: quote?.volume ? formatCompact(quote.volume) : "—" },
            {
              label: "Avg. Volume",
              value: quote?.avgVolume ? formatCompact(quote.avgVolume) : "—",
            },
            { label: "MA 50", value: formatPrice(quote?.priceAvg50) },
            { label: "MA 200", value: formatPrice(quote?.priceAvg200) },
            { label: "Exchange", value: quote?.exchange || "—" },
          ]}
        />
      </div>

      {meta && topMembers.length > 0 ? (
        <section className="mt-10">
          <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
            <h2 className="text-xl font-semibold text-header">{meta.label} Constituents</h2>
            <div className="flex gap-3 text-sm">
              <Link href={stockPath(ticker, "/constituents")} className="text-link hover:underline">
                All {formatInteger(members?.rows.length)} members
              </Link>
              <Link href={`/list/${meta.listSlug}`} className="text-link hover:underline">
                Full list
              </Link>
            </div>
          </div>
          <SymbolTable rows={topMembers} empty="Constituent quotes are unavailable." />
        </section>
      ) : null}

      <section className="mt-10">
        <div className="mb-3 flex items-end justify-between">
          <h2 className="text-xl font-semibold text-header">Market News</h2>
          <Link href={stockPath(ticker, "/news")} className="text-sm text-link hover:underline">
            More news
          </Link>
        </div>
        <p className="mb-3 text-sm text-muted">
          FMP does not publish headlines tagged to index tickers, so this is the latest U.S. stock market news.
        </p>
        <NewsList items={news} />
      </section>
    </Container>
  );
}
