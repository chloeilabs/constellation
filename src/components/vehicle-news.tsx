import { Container } from "@/components/container";
import { PageHeader } from "@/components/page-header";
import { QuoteNewsTabs } from "@/components/quote-news-tabs";
import { getPressReleases, getSecFilings, getSymbolNews } from "@/lib/fmp";
import { overviewSecFilings } from "@/lib/filings";
import { decodeTicker } from "@/lib/listings";
import { addDays, isoDate, nyDateString } from "@/lib/utils";
import { vehicleNoun, vehiclePath, type VehicleKind } from "@/lib/vehicle";

export async function VehicleNews({ symbol, kind }: { symbol: string; kind: VehicleKind }) {
  const ticker = decodeTicker(symbol);
  const noun = vehicleNoun(kind);
  const to = nyDateString();
  const from = isoDate(addDays(new Date(`${to}T00:00:00Z`), -540));
  const newsHref = vehiclePath(kind, ticker, "/news");
  const [news, press, filings] = await Promise.all([
    getSymbolNews(ticker, 30),
    getPressReleases(ticker, 20),
    getSecFilings(ticker, from, to, 20),
  ]);

  return (
    <Container>
      <PageHeader title={`${ticker} News`} description={`Headlines, press releases, and filings for this ${noun}.`} />
      <QuoteNewsTabs
        symbol={ticker}
        news={news}
        press={press}
        filings={overviewSecFilings(filings, 12)}
        moreHref={{ all: newsHref, press: newsHref, filings: newsHref }}
      />
    </Container>
  );
}
