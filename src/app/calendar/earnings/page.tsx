import Link from "next/link";
import { Container } from "@/components/container";
import { PageHeader } from "@/components/page-header";
import { SectionNav } from "@/components/section-nav";
import { ChangePercent } from "@/components/change";
import { CALENDAR_NAV } from "@/lib/nav";
import { formatCompactUsd, formatDate, formatPrice } from "@/lib/format";
import { getEarningsCalendar, getLatestFinancialStatementsArchive } from "@/lib/fmp";
import { isPrimaryUsSymbol, quoteHref } from "@/lib/listings";
import { TABLE_PAGE_SIZE, pageNumber, paginate, pagerLinks } from "@/lib/paging";
import { addDays, cn, isoDate, nyDateString } from "@/lib/utils";
import { TablePager } from "@/components/table-pager";

const VIEWS = [
  { id: "all", label: "All" },
  { id: "reported", label: "Just Reported" },
  { id: "upcoming", label: "Upcoming" },
] as const;

type EarningsView = (typeof VIEWS)[number]["id"];

function groupEarningsByDate<T extends { date: string; symbol: string }>(rows: T[]) {
  const sorted = [...rows].sort((a, b) => a.date.localeCompare(b.date) || a.symbol.localeCompare(b.symbol));
  const groups: { date: string; rows: T[] }[] = [];
  for (const row of sorted) {
    const day = row.date.slice(0, 10);
    const last = groups.at(-1);
    if (last && last.date === day) last.rows.push(row);
    else groups.push({ date: day, rows: [row] });
  }
  return groups;
}

export default async function EarningsCalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string; view?: string; page?: string; added?: string }>;
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
    view === "reported" ? getLatestFinancialStatementsArchive() : Promise.resolve([]),
  ]);
  const rows = calendar.filter((row) => isPrimaryUsSymbol(row.symbol)).filter((row) => {
    if (view === "reported") return row.epsActual != null;
    if (view === "upcoming") return row.epsActual == null && row.date >= today;
    return true;
  });
  const statementRows = latestStatements
    .filter((row) => isPrimaryUsSymbol(row.symbol))
    .filter((row, index, list) => list.findIndex((item) => item.symbol === row.symbol && item.period === row.period && item.date === row.date) === index);
  const statements = paginate(statementRows, pageNumber(params.added), TABLE_PAGE_SIZE);
  const feed = paginate(rows, pageNumber(params.page), TABLE_PAGE_SIZE);
  const grouped = groupEarningsByDate(feed.rows);
  if (view === "reported") grouped.reverse();
  const extra = {
    from: params.from,
    to: params.to,
    view: view === "all" ? undefined : view,
    added: statements.page > 1 ? String(statements.page) : undefined,
  };
  const addedExtra = {
    from: params.from,
    to: params.to,
    view: view === "all" ? undefined : view,
    page: feed.page > 1 ? String(feed.page) : undefined,
  };

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
            scroll={false}
            className={cn(
              "rounded px-3 py-1.5 font-medium",
              view === item.id ? "bg-brand text-white" : "text-muted hover:text-header",
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
          <input type="date" name="from" defaultValue={from} className="sa-input w-auto" />
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-muted">To</span>
          <input type="date" name="to" defaultValue={to} className="sa-input w-auto" />
        </label>
        <button type="submit" className="sa-btn sa-btn-primary">
          Update
        </button>
      </form>
      {view === "reported" && statements.total > 0 ? (
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
                {statements.rows.map((row) => (
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
          <TablePager
            from={statements.from}
            to={statements.to}
            total={statements.total}
            page={statements.page}
            pageCount={statements.pageCount}
            {...pagerLinks("/calendar/earnings", statements.page, statements.pageCount, addedExtra, "added")}
          />
        </section>
      ) : null}
      {grouped.length === 0 ? (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="sa-table">
            <tbody>
              <tr>
                <td className="text-muted">No earnings in this date range.</td>
              </tr>
            </tbody>
          </table>
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          {grouped.map((group) => (
            <section key={group.date}>
              <h2 className="mb-3 text-lg font-semibold text-header">
                {formatDate(group.date, { weekday: true })} · Earnings
              </h2>
              <div className="overflow-x-auto rounded-lg border border-border">
                <table className="sa-table">
                  <thead>
                    <tr>
                      <th>Symbol</th>
                      <th className="num">EPS Est.</th>
                      <th className="num">EPS Actual</th>
                      <th className="num">Surprise</th>
                      <th className="num">Revenue Est.</th>
                      <th className="num">Revenue Actual</th>
                    </tr>
                  </thead>
                  <tbody>
                    {group.rows.map((row) => {
                      const surprise =
                        row.epsActual != null && row.epsEstimated != null ? row.epsActual - row.epsEstimated : null;
                      const surprisePct =
                        surprise != null && row.epsEstimated ? surprise / Math.abs(row.epsEstimated) : null;
                      return (
                        <tr key={`${row.symbol}-${row.date}`}>
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
                    })}
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
        {...pagerLinks("/calendar/earnings", feed.page, feed.pageCount, extra)}
      />
    </Container>
  );
}
