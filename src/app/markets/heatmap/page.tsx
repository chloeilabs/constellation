import Link from "next/link";
import { Container } from "@/components/container";
import { PageHeader } from "@/components/page-header";
import { SectionNav } from "@/components/section-nav";
import { HEATMAP_INDEX_NAV, MARKET_NAV } from "@/lib/nav";
import { IndustryTiles, MarketHeatmap } from "@/components/market-heatmap";
import { heatStyle } from "@/lib/heatmap";
import { getIndexConstituents, getIndustryPerformance, getQuotes, getSectorPerformance } from "@/lib/fmp";
import { industrySlug } from "@/lib/industries";
import { addDays, cn, isoDate, nyDateString } from "@/lib/utils";

const INDEX_META = {
  sp500: { key: "sp500" as const, title: "S&P 500 Heatmap", description: "Size is market cap. Color is today's percentage change." },
  nasdaq: { key: "nasdaq" as const, title: "Nasdaq 100 Heatmap", description: "Nasdaq-100 constituents sized by market cap and colored by today's move." },
  dow: { key: "dow" as const, title: "Dow Jones Heatmap", description: "Dow Jones Industrial Average constituents sized by market cap and colored by today's move." },
};

export default async function HeatmapPage({
  searchParams,
}: {
  searchParams: Promise<{ index?: string }>;
}) {
  const { index: indexParam } = await searchParams;
  const index = indexParam === "nasdaq" || indexParam === "dow" ? indexParam : "sp500";
  const meta = INDEX_META[index];
  const today = nyDateString();
  const yesterday = isoDate(addDays(new Date(`${today}T00:00:00Z`), -1));
  const [constituents, industriesToday, industriesYesterday, sectorsToday, sectorsYesterday] = await Promise.all([
    getIndexConstituents(meta.key),
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
  const activeHref = index === "sp500" ? "/markets/heatmap" : `/markets/heatmap?index=${index}`;

  return (
    <Container>
      <PageHeader title={meta.title} description={meta.description} />
      <SectionNav items={MARKET_NAV} />
      <div className="mb-5 flex flex-wrap gap-2">
        {HEATMAP_INDEX_NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "rounded-full px-3 py-1 text-sm font-medium",
              item.href === activeHref ? "bg-header text-white" : "bg-chip text-header hover:bg-border",
            )}
          >
            {item.label}
          </Link>
        ))}
      </div>
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
            rows={sectors.map((row) => ({
              industry: row.sector,
              averageChange: row.averageChange,
              href: `/stocks/industry#${industrySlug(row.sector)}`,
            }))}
          />
        </section>
      ) : null}
      <section className="mt-10">
        <h2 className="mb-3 text-lg font-semibold text-header">Industries</h2>
        <IndustryTiles
          rows={industries.map((row) => ({
            industry: row.industry,
            averageChange: row.averageChange,
            href: `/stocks/industry/${industrySlug(row.industry)}`,
          }))}
        />
      </section>
    </Container>
  );
}
