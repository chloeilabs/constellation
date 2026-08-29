import { Container } from "@/components/container";
import { MarketQuotesTable } from "@/components/market-quotes-table";
import { PageHeader } from "@/components/page-header";
import { SectionNav } from "@/components/section-nav";
import { MARKET_NAV } from "@/lib/nav";
import { getWorldIndexQuotes, WORLD_INDEX_SYMBOLS } from "@/lib/fmp";
import { INDEX_LABELS } from "@/lib/statements";

export const metadata = {
  title: "World Markets",
  description: "Live quotes for major stock indexes across Asia, Europe, the Americas, the Middle East, and Africa.",
};

export default async function GlobalMarketsPage() {
  const quotes = await getWorldIndexQuotes();
  const bySymbol = new Map(quotes.map((quote) => [quote.symbol, quote]));
  const rows = WORLD_INDEX_SYMBOLS.map((item) => {
    const quote = bySymbol.get(item.symbol);
    return {
      symbol: item.symbol,
      name: INDEX_LABELS[item.symbol] ?? quote?.name ?? item.label,
      extra: item.region,
      price: quote?.price ?? null,
      changePercentage: quote?.changePercentage ?? null,
    };
  }).filter((row) => row.price != null);

  return (
    <Container>
      <PageHeader
        title="World Markets"
        description="Major global stock indexes with live FMP quotes, including Nikkei, FTSE, DAX, Hang Seng, Bovespa, IBEX, FTSE MIB, SSE Composite, and MOEX."
      />
      <SectionNav items={MARKET_NAV} />
      <p className="mb-3 text-sm text-muted">{rows.length} indexes</p>
      <MarketQuotesTable
        title="Global Stock Indexes"
        rows={rows}
        linkSymbols
        extraLabel="Region"
        empty="World index quotes are unavailable."
      />
    </Container>
  );
}
