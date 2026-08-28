import { NewsList } from "@/components/news-list";
import { TablePager } from "@/components/table-pager";
import { pageHref } from "@/lib/paging";
import type { FmpNewsItem } from "@/lib/types";

export function NewsWindowPager({
  items,
  page,
  pageSize,
  path,
  showSymbol = true,
}: {
  items: FmpNewsItem[];
  page: number;
  pageSize: number;
  path: string;
  showSymbol?: boolean;
}) {
  const from = items.length ? (page - 1) * pageSize + 1 : 0;
  const to = from === 0 ? 0 : from + items.length - 1;
  return (
    <>
      <NewsList items={items} showSymbol={showSymbol} />
      <TablePager
        from={from}
        to={to}
        page={page}
        firstHref={page > 1 ? pageHref(path, 1) : undefined}
        prevHref={page > 1 ? pageHref(path, page - 1) : undefined}
        nextHref={items.length >= pageSize ? pageHref(path, page + 1) : undefined}
      />
    </>
  );
}
