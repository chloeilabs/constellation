import { Container } from "@/components/container";
import { CongressTable } from "@/components/congress-table";
import { PageHeader } from "@/components/page-header";
import { TablePager } from "@/components/table-pager";
import { loadSymbolCongressTradesArchive } from "@/lib/congress";
import { decodeTicker, stockPath } from "@/lib/listings";
import { TABLE_PAGE_SIZE, pageNumber, paginate, pagerLinks } from "@/lib/paging";

export default async function StockCongressPage({
  params,
  searchParams,
}: {
  params: Promise<{ symbol: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { symbol } = await params;
  const { page: pageParam } = await searchParams;
  const ticker = decodeTicker(symbol);
  const rows = await loadSymbolCongressTradesArchive(ticker);
  const feed = paginate(rows, pageNumber(pageParam), TABLE_PAGE_SIZE);
  const base = stockPath(ticker, "/congress");

  return (
    <Container>
      <PageHeader
        title={`${ticker} Congressional Trades`}
        description={`STOCK Act disclosures from U.S. senators and representatives involving ${ticker}.`}
      />
      <CongressTable
        rows={feed.rows}
        showSymbol={false}
        empty={`No recent congressional trades reported for ${ticker}.`}
      />
      <TablePager
        from={feed.from}
        to={feed.to}
        total={feed.total}
        page={feed.page}
        pageCount={feed.pageCount}
        {...pagerLinks(base, feed.page, feed.pageCount)}
      />
    </Container>
  );
}
