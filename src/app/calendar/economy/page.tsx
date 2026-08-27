import { Container } from "@/components/container";
import { PageHeader } from "@/components/page-header";
import { SectionNav } from "@/components/section-nav";
import { CALENDAR_NAV } from "@/lib/nav";
import { formatCompactUsd, formatDate, formatNumber, formatPercentPlain } from "@/lib/format";
import { getEconomicCalendar, getEconomicIndicator, getTreasuryRates } from "@/lib/fmp";
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
  const indicatorFrom = isoDate(addDays(new Date(`${today}T00:00:00Z`), -800));
  const treasuryFrom = isoDate(addDays(new Date(`${today}T00:00:00Z`), -14));
  const [rows, treasury, fedFunds, unemployment, cpi, inflation, gdp] = await Promise.all([
    getEconomicCalendar(from, to, "US"),
    getTreasuryRates(treasuryFrom, today),
    getEconomicIndicator("federalFunds", indicatorFrom, today),
    getEconomicIndicator("unemploymentRate", indicatorFrom, today),
    getEconomicIndicator("CPI", indicatorFrom, today),
    getEconomicIndicator("inflationRate", indicatorFrom, today),
    getEconomicIndicator("GDP"),
  ]);
  const latestTreasury = [...treasury].sort((a, b) => b.date.localeCompare(a.date))[0] ?? null;
  const latest = (items: { date: string; value: number }[]) =>
    [...items].sort((a, b) => b.date.localeCompare(a.date))[0] ?? null;
  const indicators = [
    { label: "Fed Funds", value: latest(fedFunds)?.value, kind: "percent" as const },
    { label: "Unemployment", value: latest(unemployment)?.value, kind: "percent" as const },
    { label: "CPI", value: latest(cpi)?.value, kind: "number" as const },
    { label: "Inflation", value: latest(inflation)?.value, kind: "percent" as const },
    { label: "GDP", value: latest(gdp)?.value, kind: "gdp" as const },
  ];

  return (
    <Container>
      <PageHeader
        title="Economic Calendar"
        description="U.S. economic releases that can move stocks, indexes, and rates."
      />
      <SectionNav items={CALENDAR_NAV} />
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {indicators.map((item) => (
          <div key={item.label} className="rounded-lg border border-border p-4">
            <div className="text-sm text-muted">{item.label}</div>
            <div className="mt-1 text-2xl font-semibold tabular">
              {typeof item.value !== "number"
                ? "—"
                : item.kind === "percent"
                  ? formatPercentPlain(item.value, { alreadyPercent: true })
                  : item.kind === "gdp"
                    ? formatCompactUsd(item.value * 1e9)
                    : formatNumber(item.value)}
            </div>
          </div>
        ))}
      </div>
      {latestTreasury ? (
        <section className="mb-8">
          <h2 className="mb-3 text-lg font-semibold text-header">Treasury Yields</h2>
          <p className="mb-3 text-sm text-muted">Latest U.S. Treasury curve as of {formatDate(latestTreasury.date)}.</p>
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="sa-table">
              <thead>
                <tr>
                  <th>1M</th>
                  <th>3M</th>
                  <th>6M</th>
                  <th>1Y</th>
                  <th>2Y</th>
                  <th>5Y</th>
                  <th>10Y</th>
                  <th>30Y</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>{formatPercentPlain(latestTreasury.month1, { alreadyPercent: true })}</td>
                  <td>{formatPercentPlain(latestTreasury.month3, { alreadyPercent: true })}</td>
                  <td>{formatPercentPlain(latestTreasury.month6, { alreadyPercent: true })}</td>
                  <td>{formatPercentPlain(latestTreasury.year1, { alreadyPercent: true })}</td>
                  <td>{formatPercentPlain(latestTreasury.year2, { alreadyPercent: true })}</td>
                  <td>{formatPercentPlain(latestTreasury.year5, { alreadyPercent: true })}</td>
                  <td>{formatPercentPlain(latestTreasury.year10, { alreadyPercent: true })}</td>
                  <td>{formatPercentPlain(latestTreasury.year30, { alreadyPercent: true })}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      ) : null}
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
