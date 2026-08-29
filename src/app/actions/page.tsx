import Link from "next/link";
import { Container } from "@/components/container";
import { DownloadCsvLink } from "@/components/download-csv-link";
import { PageHeader } from "@/components/page-header";
import { SectionNav } from "@/components/section-nav";
import { TablePager } from "@/components/table-pager";
import { loadCorporateActions } from "@/lib/corporate-actions";
import { formatDate } from "@/lib/format";
import { quoteHref } from "@/lib/listings";
import { CALENDAR_NAV } from "@/lib/nav";
import { TABLE_PAGE_SIZE, pageNumber, paginate, pagerLinks } from "@/lib/paging";

export default async function ActionsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageParam } = await searchParams;
  const rows = await loadCorporateActions();
  const feed = paginate(rows, pageNumber(pageParam), TABLE_PAGE_SIZE);

  return (
    <Container>
      <PageHeader
        title="Corporate Actions"
        description="Recent U.S. stock splits, ticker changes, delistings, priced IPOs, and acquisitions from Financial Modeling Prep."
        actions={<DownloadCsvLink href="/actions/csv">Download CSV</DownloadCsvLink>}
      />
      <SectionNav items={CALENDAR_NAV} />
      <p className="mb-3 text-sm text-muted">
        Upcoming splits also appear on the{" "}
        <Link href="/calendar/splits" className="text-link hover:underline">
          split calendar
        </Link>
        .
      </p>
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="sa-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Symbol</th>
              <th>Type</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {feed.rows.length === 0 ? (
              <tr>
                <td colSpan={4} className="text-muted">
                  No recent corporate actions.
                </td>
              </tr>
            ) : (
              feed.rows.map((row) => (
                <tr key={`${row.date}-${row.symbol}-${row.type}-${row.action}`}>
                  <td>{formatDate(row.date)}</td>
                  <td className="symbol">
                    <Link href={quoteHref(row.symbol)} className="text-link hover:underline">
                      {row.symbol}
                    </Link>
                  </td>
                  <td>{row.type}</td>
                  <td>{row.action}</td>
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
        {...pagerLinks("/actions", feed.page, feed.pageCount)}
      />
    </Container>
  );
}
