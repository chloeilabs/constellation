import Link from "next/link";
import { Container } from "@/components/container";
import { PageHeader } from "@/components/page-header";
import { SectionNav } from "@/components/section-nav";
import { ChangePercent } from "@/components/change";
import { CALENDAR_NAV } from "@/lib/nav";
import { formatCompactUsd, formatDate, formatPrice } from "@/lib/format";
import { getEarningsCalendar, getLatestFinancialStatements } from "@/lib/fmp";
import { isPrimaryUsSymbol, quoteHref } from "@/lib/listings";
import { addDays, cn, isoDate, nyDateString } from "@/lib/utils";

const VIEWS = [
  { id: "all", label: "All" },
  { id: "reported", label: "Just Reported" },
  { id: "upcoming", label: "Upcoming" },
] as const;

type EarningsView = (typeof VIEWS)[number]["id"];

export default async function EarningsCalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string; view?: string }>;
}) {
  const params = await searchParams;
  const view: EarningsView =
    params.view === "reported" || params.view === "upcoming" ? params.view : "all";
  const today = nyDateString();
  const defaultFrom =
    view === "upcoming"
      ? today
      : isoDate(addDays(new Date(`${today}T00:00:00Z`), view === "reported" ? -14 : -7));
  const defaultTo =
    view === "reported" ? today : isoDate(addDays(new Date(`${today}T00:00:00Z`), view === "upcoming" ? 14 : 7));
  const from = params.from || defaultFrom;
  const to = params.to || defaultTo;
  const [calendar, latestStatements] = await Promise.all([
    getEarningsCalendar(from, to),
    view === "reported"
      ? Promise.all([getLatestFinancialStatements(0, 100), getLatestFinancialStatements(1, 100)]).then((pages) =>
          pages.flat(),
        )
      : Promise.resolve([]),
  ]);
  const rows = calendar.filter((row) => isPrimaryUsSymbol(row.symbol)).filter((row) => {
    if (view === "reported") return row.epsActual != null;
    if (view === "upcoming") return row.epsActual == null && row.date >= today;
    return true;
  });
  const statements = latestStatements
    .filter((row) => isPrimaryUsSymbol(row.symbol))
    .filter((row, index, list) => list.findIndex((item) => item.symbol === row.symbol && item.period === row.period && item.date === row.date) === index)
    .slice(0, 25);

  return (
    <Container>
      <PageHeader
        title={view === "reported" ? "Just Reported Earnings" : view === "upcoming" ? "Upcoming Earnings" : "Earnings Calendar"}
        description="Upcoming and recent earnings announcements."
      />
      <SectionNav items={CALENDAR_NAV} />
      <div className="mb-5 inline-flex rounded-md border border-border p-0.5 text-sm">
        {VIEWS.map((item) => (
          <Link
            key={item.id}
            href={item.id === "all" ? "/calendar/earnings" : `/calendar/earnings?view=${item.id}`}
            className={cn(
              "rounded px-3 py-1.5 font-medium",
              view === item.id ? "bg-header text-on-header" : "text-muted hover:text-header",
            )}
          >
            {item.label}
          </Link>
        ))}
      </div>
      <form className="mb-6 flex flex-wrap items-end gap-3">
        {view !== "all" ? <input type="hidden" name="view" value={view} /> : null}
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
      {view === "reported" && statements.length > 0 ? (
        <section className="mb-10">
          <h2 className="mb-3 text-lg font-semibold text-header">Statements just added</h2>
          <p className="mb-3 text-sm text-muted">
            Newly ingested income statements from FMP, which can land after the earnings print.
          </p>
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="sa-table">
              <thead>
                <tr>
                  <th>Added</th>
                  <th>Symbol</th>
                  <th>Period</th>
                  <th>Period End</th>
                </tr>
              </thead>
              <tbody>
                {statements.map((row) => (
                  <tr key={`${row.symbol}-${row.period}-${row.date}-${row.dateAdded}`}>
                    <td>{formatDate(row.dateAdded)}</td>
                    <td className="symbol">
                      <Link href={quoteHref(row.symbol)} className="text-link hover:underline">
                        {row.symbol}
                      </Link>
                    </td>
                    <td>
                      {row.period} {row.calendarYear}
                    </td>
                    <td>{formatDate(row.date)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}
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
