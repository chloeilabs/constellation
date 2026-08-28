import { Container } from "@/components/container";
import { NewsList } from "@/components/news-list";
import { PageHeader } from "@/components/page-header";
import { SectionNav } from "@/components/section-nav";
import { getPressReleases, getStockNews, getSymbolNews } from "@/lib/fmp";
import { isIndexTicker } from "@/lib/indexes";
import { decodeTicker } from "@/lib/listings";
import { quoteNewsNav } from "@/lib/nav";
import { mergeNews } from "@/lib/news";

export default async function StockNewsPage({ params }: { params: Promise<{ symbol: string }> }) {
  const { symbol } = await params;
  const ticker = decodeTicker(symbol);
  if (isIndexTicker(ticker)) {
    const items = await getStockNews(40);
    return (
      <Container>
        <PageHeader
          title={`${ticker} News`}
          description="FMP does not publish headlines tagged to index tickers. This is the latest U.S. stock market news."
        />
        <NewsList items={items} />
      </Container>
    );
  }

  const [news, press] = await Promise.all([getSymbolNews(ticker, 30), getPressReleases(ticker, 20)]);
  const items = mergeNews(news, press);

  return (
    <Container>
      <PageHeader title={`${ticker} News`} description="Headlines and press releases for this stock." />
      <SectionNav items={quoteNewsNav(ticker)} />
      <NewsList items={items} showSymbol={false} />
    </Container>
  );
}
