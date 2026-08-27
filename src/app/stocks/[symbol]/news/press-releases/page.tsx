import { notFound } from "next/navigation";
import { Container } from "@/components/container";
import { NewsList } from "@/components/news-list";
import { PageHeader } from "@/components/page-header";
import { SectionNav } from "@/components/section-nav";
import { getPressReleases } from "@/lib/fmp";
import { isIndexTicker } from "@/lib/indexes";
import { decodeTicker } from "@/lib/listings";
import { quoteNewsNav } from "@/lib/nav";

export default async function StockPressReleasesPage({ params }: { params: Promise<{ symbol: string }> }) {
  const { symbol } = await params;
  const ticker = decodeTicker(symbol);
  if (isIndexTicker(ticker)) notFound();
  const press = await getPressReleases(ticker, 40);

  return (
    <Container>
      <PageHeader title={`${ticker} Press Releases`} description="Company press releases from Financial Modeling Prep." />
      <SectionNav items={quoteNewsNav(ticker)} />
      <NewsList items={press} showSymbol={false} />
    </Container>
  );
}
