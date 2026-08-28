import Link from "next/link";
import { Container } from "@/components/container";
import { PageHeader } from "@/components/page-header";
import { SectionNav } from "@/components/section-nav";
import { TablePager } from "@/components/table-pager";
import { CALENDAR_NAV } from "@/lib/nav";
import { formatDate, formatPrice } from "@/lib/format";
import { getDividendCalendarWindow } from "@/lib/fmp";
import { isForeignListingSymbol, quoteHref } from "@/lib/listings";
import { TABLE_PAGE_SIZE, pageNumber, paginate, pagerLinks } from "@/lib/paging";
import { addDays, isoDate, nyDateString } from "@/lib/utils";
import type { FmpDividend } from "@/lib/types";

function groupDividendsByDate(rows: FmpDividend[]) {
  const groups: { date: string; rows: FmpDividend[] }[] = [];
  for (const row of rows) {
    const day = row.date.slice(0, 10);
    const last = groups.at(-1);
    if (last && last.date === day) last.rows.push(row);
    else groups.push({ date: day, rows: [row] });
  }
  return groups;
}

export const metadata = {
  title: "Dividend Calendar",
  description: "Upcoming and recent ex-dividend dates for U.S.-listed stocks and ETFs.",
};

export default async function DividendCalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string; page?: string }>;
}) {
  const params = await searchParams;
  const today = nyDateString();
  const from = params.from || isoDate(addDays(new Date(`${today}T00:00:00Z`), -14));
  const to = params.to || isoDate(addDays(new Date(`${today}T00:00:00Z`), 45));
  const raw = await getDividendCalendarWindow(from, to);
  const usRows = raw.filter((row) => row.symbol && !isForeignListingSymbol(row.symbol));
  const source = usRows.length ? usRows : raw;
  const feed = paginate(source, pageNumber(params.page), TABLE_PAGE_SIZE);
  const groups = groupDividendsByDate(feed.rows);
  const extra = { from: params.from, to: params.to };

  return (
    <Container>
      <PageHeader
        title="Dividend Calendar"
        description="Upcoming and recent ex-dividend dates from live FMP filings. Long windows are sliced so the 4,000-row calendar cap does not drop nearby payers."
      />
      <SectionNav items={CALENDAR_NAV} />
      <form className="mb-6 flex flex-wrap items-end gap-3">
        <label className="text-sm">
          <span className="mb-1 block text-muted">From</span>
          <input type="date" name="from" defaultValue={from} className="h-9 rounded-md border border-border px-2" />
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-muted">To</span>
          <input type="date" name="to" defaultValue={to} className="h-9 rounded-md border border-border px-2" />
        </label>
        <button type="submit" className="h-9 rounded-md bg-header px-4 text-sm font-medium text-on-header">
          Update
        </button>
      </form>
      {groups.length === 0 ? (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="sa-table">
            <tbody>
              <tr>
                <td className="text-muted">No dividends in this date range.</td>
              </tr>
            </tbody>
          </table>
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          {groups.map((group) => (
            <section key={group.date}>
              <h2 className="mb-3 text-lg font-semibold text-header">
                {formatDate(group.date, { weekday: true })}
              </h2>
              <div className="overflow-x-auto rounded-lg border border-border">
                <table className="sa-table">
                  <thead>
                    <tr>
                      <th>Symbol</th>
                      <th className="num">Dividend</th>
                      <th>Payment</th>
                      <th>Frequency</th>
                    </tr>
                  </thead>
                  <tbody>
                    {group.rows.map((row, index) => (
                      <tr key={`${row.symbol}-${row.date}-${row.dividend}-${index}`}>
                        <td className="symbol">
                          <Link href={quoteHref(row.symbol)} className="text-link hover:underline">
                            {row.symbol}
                          </Link>
                        </td>
                        <td className="num">${formatPrice(row.dividend)}</td>
                        <td>{formatDate(row.paymentDate)}</td>
                        <td>{row.frequency || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          ))}
        </div>
      )}
      <TablePager
        from={feed.from}
        to={feed.to}
        total={feed.total}
        page={feed.page}
        pageCount={feed.pageCount}
        {...pagerLinks("/calendar/dividends", feed.page, feed.pageCount, extra)}
      />
    </Container>
  );
}
