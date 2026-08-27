import Link from "next/link";
import { Container } from "@/components/container";
import { PageHeader } from "@/components/page-header";
import { SectionNav } from "@/components/section-nav";
import { CALENDAR_NAV } from "@/lib/nav";
import { formatDate } from "@/lib/format";
import { getSplitsCalendar } from "@/lib/fmp";
import { isForeignListingSymbol } from "@/lib/listings";
import { addDays, isoDate, nyDateString } from "@/lib/utils";

export default async function SplitsCalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const params = await searchParams;
  const today = nyDateString();
  const from = params.from || isoDate(addDays(new Date(`${today}T00:00:00Z`), -14));
  const to = params.to || isoDate(addDays(new Date(`${today}T00:00:00Z`), 45));
  const rows = await getSplitsCalendar(from, to);
  const usRows = rows.filter((row) => !isForeignListingSymbol(row.symbol));
  const visible = (usRows.length ? usRows : rows).slice(0, 200);

  return (
    <Container>
      <PageHeader
        title="Stock Splits Calendar"
        description="Upcoming and recent stock splits, reverse splits, and share reorganizations."
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
            {visible.length === 0 ? (
              <tr>
                <td colSpan={4} className="text-muted">
                  No splits in this date range.
                </td>
              </tr>
            ) : (
              visible.map((row) => (
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
    </Container>
  );
}
