import { Container } from "@/components/container";
import { NewsList } from "@/components/news-list";
import { PageHeader } from "@/components/page-header";
import { SectionNav } from "@/components/section-nav";
import { TablePager } from "@/components/table-pager";
import { getPressReleasesArchive, getSymbolNewsArchive } from "@/lib/fmp";
import { decodeTicker } from "@/lib/listings";
import { vehicleNewsNav } from "@/lib/nav";
import { mergeNews } from "@/lib/news";
import { NEWS_PAGE_SIZE, pageNumber, paginate, pagerLinks } from "@/lib/paging";
import { vehicleNoun, vehiclePath, type VehicleKind } from "@/lib/vehicle";

export async function VehicleNews({
  symbol,
  kind,
  page: pageParam,
  feed = "all",
}: {
  symbol: string;
  kind: VehicleKind;
  page?: string;
  feed?: "all" | "press";
}) {
  const ticker = decodeTicker(symbol);
  const noun = vehicleNoun(kind);
  const page = pageNumber(pageParam);
  const [news, press] = await Promise.all([
    feed === "press" ? Promise.resolve([]) : getSymbolNewsArchive(ticker),
    getPressReleasesArchive(ticker),
  ]);
  const items = feed === "press" ? press : mergeNews(news, press);
  const window = paginate(items, page, NEWS_PAGE_SIZE);
  const path = vehiclePath(kind, ticker, feed === "press" ? "/news/press-releases" : "/news");

  return (
    <Container>
      <PageHeader
        title={feed === "press" ? `${ticker} Press Releases` : `${ticker} News`}
        description={
          feed === "press"
            ? `Company press releases for this ${noun}.`
            : `Headlines and press releases for this ${noun}. FMP pages the latest articles newest-first.`
        }
      />
      <SectionNav items={vehicleNewsNav(kind, ticker)} />
      <NewsList items={window.rows} showSymbol={false} />
      <TablePager
        from={window.from}
        to={window.to}
        total={window.total}
        page={window.page}
        pageCount={window.pageCount}
        {...pagerLinks(path, window.page, window.pageCount)}
      />
    </Container>
  );
}
