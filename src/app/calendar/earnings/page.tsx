import Link from "next/link";
import { Container } from "@/components/container";
import { PageHeader } from "@/components/page-header";
import { SectionNav } from "@/components/section-nav";
import { ChangePercent } from "@/components/change";
import { CALENDAR_NAV } from "@/lib/nav";
import { formatCompactUsd, formatDate, formatPrice } from "@/lib/format";
import { getEarningsCalendar } from "@/lib/fmp";
import { isForeignListingSymbol, quoteHref } from "@/lib/listings";
import { addDays, isoDate, nyDateString } from "@/lib/utils";

export default async function EarningsCalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const params = await searchParams;
  const today = nyDateString();
  const from = params.from || isoDate(addDays(new Date(`${today}T00:00:00Z`), -7));
  const to = params.to || isoDate(addDays(new Date(`${today}T00:00:00Z`), 7));
  const rows = (await getEarningsCalendar(from, to)).filter((row) => !isForeignListingSymbol(row.symbol));

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
              <th className="num">Surprise</th>
              <th className="num">Revenue Est.</th>
              <th className="num">Revenue Actual</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-muted">
                  No earnings in this date range.
                </td>
              </tr>
            ) : (
              rows.slice(0, 200).map((row) => {
                const surprise =
                  row.epsActual != null && row.epsEstimated != null ? row.epsActual - row.epsEstimated : null;
                const surprisePct =
                  surprise != null && row.epsEstimated ? surprise / Math.abs(row.epsEstimated) : null;
                return (
                <tr key={`${row.symbol}-${row.date}`}>
                  <td>{formatDate(row.date)}</td>
                  <td className="symbol">
                    <Link href={quoteHref(row.symbol)} className="text-link hover:underline">
                      {row.symbol}
                    </Link>
                  </td>
                  <td className="num">{formatPrice(row.epsEstimated)}</td>
                  <td className="num">{formatPrice(row.epsActual)}</td>
                  <td className="num">
                    {surprise == null ? (
                      "—"
                    ) : (
                      <span className="inline-flex items-center gap-2">
                        {formatPrice(surprise)}
                        <ChangePercent value={surprisePct} alreadyPercent={false} className="text-xs" />
                      </span>
                    )}
                  </td>
                  <td className="num">{formatCompactUsd(row.revenueEstimated)}</td>
                  <td className="num">{formatCompactUsd(row.revenueActual)}</td>
                </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </Container>
  );
}
