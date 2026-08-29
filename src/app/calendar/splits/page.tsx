import Link from "next/link";
import { Container } from "@/components/container";
import { PageHeader } from "@/components/page-header";
import { SectionNav } from "@/components/section-nav";
import { TablePager } from "@/components/table-pager";
import { CALENDAR_NAV } from "@/lib/nav";
import { formatDate } from "@/lib/format";
import { getSplitsCalendar } from "@/lib/fmp";
import { isForeignListingSymbol } from "@/lib/listings";
import { TABLE_PAGE_SIZE, pageNumber, paginate, pagerLinks } from "@/lib/paging";
import { addDays, isoDate, nyDateString } from "@/lib/utils";

export default async function SplitsCalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string; page?: string }>;
}) {
  const params = await searchParams;
  const today = nyDateString();
  const from = params.from || isoDate(addDays(new Date(`${today}T00:00:00Z`), -14));
  const to = params.to || isoDate(addDays(new Date(`${today}T00:00:00Z`), 45));
  const rows = await getSplitsCalendar(from, to);
  const usRows = rows.filter((row) => !isForeignListingSymbol(row.symbol));
  const source = usRows.length ? usRows : rows;
  const feed = paginate(source, pageNumber(params.page), TABLE_PAGE_SIZE);
  const extra = { from: params.from, to: params.to };

  return (
    <Container>
      <PageHeader
        title="Stock Splits Calendar"
        description="Upcoming and recent stock splits, reverse splits, and share reorganizations."
      />
      <SectionNav items={CALENDAR_NAV} />
      <form className="mb-6 grid grid-cols-1 gap-3 sm:flex sm:flex-wrap sm:items-end">
        <label className="min-w-0 text-sm sm:w-auto">
          <span className="mb-1 block text-muted">From</span>
          <input type="date" name="from" defaultValue={from} className="sa-input w-full min-w-0" />
        </label>
        <label className="min-w-0 text-sm sm:w-auto">
          <span className="mb-1 block text-muted">To</span>
          <input type="date" name="to" defaultValue={to} className="sa-input w-full min-w-0" />
        </label>
        <button type="submit" className="sa-btn sa-btn-primary">
          Update
        </button>
      </form>
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="sa-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Symbol</th>
              <th>Ratio</th>
              <th>Type</th>
            </tr>
          </thead>
          <tbody>
            {feed.rows.length === 0 ? (
              <tr>
                <td colSpan={4} className="text-muted">
                  No splits in this date range.
                </td>
              </tr>
            ) : (
              feed.rows.map((row) => (
                <tr key={`${row.symbol}-${row.date}-${row.numerator}-${row.denominator}`}>
                  <td>{formatDate(row.date)}</td>
                  <td className="symbol">
                    <Link href={`/stocks/${row.symbol}`} className="text-link hover:underline">
                      {row.symbol}
                    </Link>
                  </td>
                  <td>
                    {row.numerator}:{row.denominator}
                  </td>
                  <td className="capitalize">{row.splitType?.replace("-", " ") || "Stock split"}</td>
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
        {...pagerLinks("/calendar/splits", feed.page, feed.pageCount, extra)}
      />
    </Container>
  );
}
