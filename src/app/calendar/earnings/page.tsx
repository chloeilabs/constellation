import Link from "next/link";
import { Container } from "@/components/container";
import { PageHeader } from "@/components/page-header";
import { SectionNav, CALENDAR_NAV } from "@/components/section-nav";
import { formatCompactUsd, formatDate, formatPrice } from "@/lib/format";
import { getEarningsCalendar } from "@/lib/fmp";
import { addDays, isoDate, nyDateString } from "@/lib/utils";

export default async function EarningsCalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const params = await searchParams;
  const today = nyDateString();
  const from = params.from || today;
  const to = params.to || isoDate(addDays(new Date(`${today}T00:00:00Z`), 7));
  const rows = await getEarningsCalendar(from, to);

  return (
    <Container>
      <PageHeader
        title="Earnings Calendar"
        description="Upcoming and recent earnings announcements."
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
        <button type="submit" className="h-9 rounded-md bg-header px-4 text-sm font-medium text-white">
          Update
        </button>
      </form>
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="sa-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Symbol</th>
              <th className="num">EPS Est.</th>
              <th className="num">EPS Actual</th>
              <th className="num">Revenue Est.</th>
              <th className="num">Revenue Actual</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-muted">
                  No earnings in this date range.
                </td>
              </tr>
            ) : (
              rows.slice(0, 200).map((row) => (
                <tr key={`${row.symbol}-${row.date}`}>
                  <td>{formatDate(row.date)}</td>
                  <td className="symbol">
                    <Link href={`/stocks/${row.symbol}`} className="text-link hover:underline">
                      {row.symbol}
                    </Link>
                  </td>
                  <td className="num">{formatPrice(row.epsEstimated)}</td>
                  <td className="num">{formatPrice(row.epsActual)}</td>
                  <td className="num">{formatCompactUsd(row.revenueEstimated)}</td>
                  <td className="num">{formatCompactUsd(row.revenueActual)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </Container>
  );
}
