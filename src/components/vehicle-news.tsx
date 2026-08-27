import { Container } from "@/components/container";
import { NewsList } from "@/components/news-list";
import { PageHeader } from "@/components/page-header";
import { getPressReleases, getSymbolNews } from "@/lib/fmp";
import { decodeTicker } from "@/lib/listings";
import { vehicleNoun, type VehicleKind } from "@/lib/vehicle";

export async function VehicleNews({ symbol, kind }: { symbol: string; kind: VehicleKind }) {
  const ticker = decodeTicker(symbol);
  const noun = vehicleNoun(kind);
  const [news, press] = await Promise.all([getSymbolNews(ticker, 30), getPressReleases(ticker, 10)]);

  return (
    <Container>
      <PageHeader title={`${ticker} News`} description={`Headlines and press releases for this ${noun}.`} />
      <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr]">
        <section>
          <h2 className="mb-3 text-lg font-semibold text-header">Headlines</h2>
          <NewsList items={news} showSymbol={false} />
        </section>
        <section>
          <h2 className="mb-3 text-lg font-semibold text-header">Press Releases</h2>
          <NewsList items={press} showSymbol={false} />
        </section>
      </div>
    </Container>
  );
}
