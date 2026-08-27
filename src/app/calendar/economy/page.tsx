import { Container } from "@/components/container";
import { PageHeader } from "@/components/page-header";
import { SectionNav, CALENDAR_NAV } from "@/components/section-nav";
import { formatDate, formatNumber } from "@/lib/format";
import { getEconomicCalendar } from "@/lib/fmp";
import { addDays, isoDate, nyDateString } from "@/lib/utils";

export default async function EconomicCalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const params = await searchParams;
  const today = nyDateString();
  const from = params.from || isoDate(addDays(new Date(`${today}T00:00:00Z`), -3));
  const to = params.to || isoDate(addDays(new Date(`${today}T00:00:00Z`), 14));
  const rows = await getEconomicCalendar(from, to, "US");

  return (
    <Container>
      <PageHeader
        title="Economic Calendar"
        description="U.S. economic releases that can move stocks, indexes, and rates."
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
              <th>Event</th>
              <th>Impact</th>
              <th className="num">Actual</th>
              <th className="num">Estimate</th>
              <th className="num">Previous</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-muted">
                  No U.S. economic releases in this range.
                </td>
              </tr>
            ) : (
              rows.slice(0, 120).map((row, index) => (
                <tr key={`${row.date}-${row.event}-${index}`}>
                  <td>{formatDate(row.date)}</td>
                  <td className="max-w-[360px] truncate">{row.event}</td>
                  <td>{row.impact || "—"}</td>
                  <td className="num">{row.actual == null ? "—" : formatNumber(row.actual)}</td>
                  <td className="num">{row.estimate == null ? "—" : formatNumber(row.estimate)}</td>
                  <td className="num">{row.previous == null ? "—" : formatNumber(row.previous)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </Container>
  );
}
