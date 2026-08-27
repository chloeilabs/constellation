import { Container } from "@/components/container";
import { PageHeader } from "@/components/page-header";
import { SectionNav } from "@/components/section-nav";
import { MARKET_NAV } from "@/lib/nav";
import { IndustryTiles, MarketHeatmap } from "@/components/market-heatmap";
import { heatStyle } from "@/lib/heatmap";
import { getIndexConstituents, getIndustryPerformance, getQuotes, getSectorPerformance } from "@/lib/fmp";
import { addDays, isoDate, nyDateString } from "@/lib/utils";

export default async function HeatmapPage() {
  const today = nyDateString();
  const yesterday = isoDate(addDays(new Date(`${today}T00:00:00Z`), -1));
  const [constituents, industriesToday, industriesYesterday, sectorsToday, sectorsYesterday] = await Promise.all([
    getIndexConstituents("sp500"),
    getIndustryPerformance(today),
    getIndustryPerformance(yesterday),
    getSectorPerformance(today),
    getSectorPerformance(yesterday),
  ]);
  const quotes = await getQuotes(constituents.map((row) => row.symbol));
  const bySymbol = new Map(quotes.map((quote) => [quote.symbol, quote]));
  const stocks = constituents
    .map((row) => {
      const quote = bySymbol.get(row.symbol);
      return {
        symbol: row.symbol,
        name: row.name,
        sector: row.sector,
        marketCap: quote?.marketCap ?? 0,
        changePercentage: quote?.changePercentage ?? null,
      };
    })
    .filter((row) => row.marketCap > 0);
  const industries = (industriesToday.length ? industriesToday : industriesYesterday)
    .slice()
    .sort((a, b) => b.averageChange - a.averageChange);
  const sectors = sectorsToday.length ? sectorsToday : sectorsYesterday;

  return (
    <Container>
      <PageHeader
        title="S&P 500 Heatmap"
        description="Size is market cap. Color is today's percentage change. Industry tiles use NASDAQ average moves."
      />
      <SectionNav items={MARKET_NAV} />
      <MarketHeatmap rows={stocks} />
      <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted">
        <span>Color scale</span>
        <span className="rounded px-2 py-1 font-medium" style={heatStyle(-3.5)}>
          −3.5%
        </span>
        <span className="rounded px-2 py-1 font-medium" style={heatStyle(0)}>
          Unch
        </span>
        <span className="rounded px-2 py-1 font-medium" style={heatStyle(3.5)}>
          +3.5%
        </span>
      </div>
      {sectors.length > 0 ? (
        <section className="mt-10">
          <h2 className="mb-3 text-lg font-semibold text-header">Sectors</h2>
          <IndustryTiles
            rows={sectors.map((row) => ({ industry: row.sector, averageChange: row.averageChange }))}
          />
        </section>
      ) : null}
      <section className="mt-10">
        <h2 className="mb-3 text-lg font-semibold text-header">Industries</h2>
        <IndustryTiles rows={industries.map((row) => ({ industry: row.industry, averageChange: row.averageChange }))} />
      </section>
    </Container>
  );
}
