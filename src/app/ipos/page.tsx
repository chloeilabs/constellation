import { Container } from "@/components/container";
import { PageHeader } from "@/components/page-header";
import { SectionNav } from "@/components/section-nav";
import { ChangePercent } from "@/components/change";
import { TablePager } from "@/components/table-pager";
import { IPO_NAV } from "@/lib/nav";
import { formatCompactUsd, formatDate, formatPrice } from "@/lib/format";
import { loadRecentPricedIpos } from "@/lib/ipo";
import { quoteHref } from "@/lib/listings";
import { TABLE_PAGE_SIZE, pageNumber, paginate, pagerLinks } from "@/lib/paging";
import Link from "next/link";

export const metadata = {
  title: "Recent IPOs",
  description: "The most recent priced initial public offerings, with current price versus IPO price.",
};

export default async function RecentIposPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageParam } = await searchParams;
  const rows = await loadRecentPricedIpos(200);
  const feed = paginate(rows, pageNumber(pageParam), TABLE_PAGE_SIZE);

  return (
    <Container>
      <PageHeader
        title="Recent IPOs"
        description="Priced initial public offerings from the FMP IPO calendar, compared with the latest quote."
      />
      <SectionNav items={IPO_NAV} />
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="sa-table">
          <thead>
            <tr>
              <th>IPO Date</th>
              <th>Symbol</th>
              <th>Company Name</th>
              <th className="num">IPO Price</th>
              <th className="num">Current</th>
              <th className="num">Return</th>
              <th className="num">Market Cap</th>
            </tr>
          </thead>
          <tbody>
            {feed.rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-muted">
                  No priced IPOs in the recent calendar window.
                </td>
              </tr>
            ) : (
              feed.rows.map((row) => (
                <tr key={`${row.symbol}-${row.date}`}>
                  <td>{formatDate(row.date)}</td>
                  <td className="symbol">
                    <Link href={quoteHref(row.symbol)} className="text-link hover:underline">
                      {row.symbol}
                    </Link>
                  </td>
                  <td className="max-w-[280px] truncate">{row.company}</td>
                  <td className="num">{row.ipoPrice == null ? "—" : `$${formatPrice(row.ipoPrice)}`}</td>
                  <td className="num">{row.current == null ? "—" : `$${formatPrice(row.current)}`}</td>
                  <td className="num">
                    <ChangePercent value={row.ipoReturn} alreadyPercent={false} />
                  </td>
                  <td className="num">{formatCompactUsd(row.marketCap)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <TablePager
        from={feed.from}
        to={feed.to}
        total={feed.total}
        page={feed.page}
        pageCount={feed.pageCount}
        {...pagerLinks("/ipos", feed.page, feed.pageCount)}
      />
    </Container>
  );
}
