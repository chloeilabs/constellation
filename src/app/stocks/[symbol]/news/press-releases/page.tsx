import { notFound } from "next/navigation";
import { Container } from "@/components/container";
import { NewsList } from "@/components/news-list";
import { PageHeader } from "@/components/page-header";
import { SectionNav } from "@/components/section-nav";
import { TablePager } from "@/components/table-pager";
import { getPressReleasesArchive } from "@/lib/fmp";
import { isIndexTicker } from "@/lib/indexes";
import { decodeTicker, stockPath } from "@/lib/listings";
import { quoteNewsNav } from "@/lib/nav";
import { NEWS_PAGE_SIZE, pageNumber, paginate, pagerLinks } from "@/lib/paging";

export default async function StockPressReleasesPage({
  params,
  searchParams,
}: {
  params: Promise<{ symbol: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { symbol } = await params;
  const { page: pageParam } = await searchParams;
  const ticker = decodeTicker(symbol);
  if (isIndexTicker(ticker)) notFound();
  const press = await getPressReleasesArchive(ticker);
  const feed = paginate(press, pageNumber(pageParam), NEWS_PAGE_SIZE);
  const path = stockPath(ticker, "/news/press-releases");

  return (
    <Container>
      <PageHeader title={`${ticker} Press Releases`} description="Company press releases from Financial Modeling Prep." />
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
