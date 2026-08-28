import { Container } from "@/components/container";
import { NewsList } from "@/components/news-list";
import { PageHeader } from "@/components/page-header";
import { SectionNav } from "@/components/section-nav";
import { TablePager } from "@/components/table-pager";
import { NewsWindowPager } from "@/components/news-window-pager";
import { getPressReleases, getStockNews, getSymbolNews } from "@/lib/fmp";
import { isIndexTicker } from "@/lib/indexes";
import { decodeTicker, stockPath } from "@/lib/listings";
import { quoteNewsNav } from "@/lib/nav";
import { mergeNews, PRESS_RELEASE_LIMIT, SYMBOL_NEWS_LIMIT } from "@/lib/news";
import { NEWS_PAGE_SIZE, pageNumber, paginate, pagerLinks } from "@/lib/paging";

export default async function StockNewsPage({
  params,
  searchParams,
}: {
  params: Promise<{ symbol: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { symbol } = await params;
  const { page: pageParam } = await searchParams;
  const ticker = decodeTicker(symbol);
  const page = pageNumber(pageParam);
  if (isIndexTicker(ticker)) {
    const items = await getStockNews(NEWS_PAGE_SIZE, page - 1);
    return (
      <Container>
        <PageHeader
          title={`${ticker} News`}
          description="FMP does not publish headlines tagged to index tickers. This is the latest U.S. stock market news."
        />
        <NewsWindowPager items={items} page={page} pageSize={NEWS_PAGE_SIZE} path={stockPath(ticker, "/news")} />
      </Container>
    );
  }

  const [news, press] = await Promise.all([
    getSymbolNews(ticker, SYMBOL_NEWS_LIMIT),
    getPressReleases(ticker, PRESS_RELEASE_LIMIT),
  ]);
  const items = mergeNews(news, press);
  const feed = paginate(items, page, NEWS_PAGE_SIZE);
  const path = stockPath(ticker, "/news");

  return (
    <Container>
      <PageHeader
        title={`${ticker} News`}
        description="Headlines and press releases for this stock. FMP returns the most recent articles."
      />
      <SectionNav items={quoteNewsNav(ticker)} />
      <NewsList items={feed.rows} showSymbol={false} />
      <TablePager
        from={feed.from}
        to={feed.to}
        total={feed.total}
        page={feed.page}
        pageCount={feed.pageCount}
        {...pagerLinks(path, feed.page, feed.pageCount)}
      />
    </Container>
  );
}
