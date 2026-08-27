import { Container } from "@/components/container";
import { PageHeader } from "@/components/page-header";
import { ChangePercent } from "@/components/change";
import { HistoryBars } from "@/components/history-bars";
import { SectionNav } from "@/components/section-nav";
import { MARKET_NAV } from "@/lib/nav";
import { formatPercent, formatRatio } from "@/lib/format";
import { getHistoricalSectorPerformance, getSectorPeSnapshot, getSectorPerformance } from "@/lib/fmp";
import { MARKET_SECTORS, sectorHref, uniqueByPreferUsExchange } from "@/lib/industries";
import { addDays, cn, isoDate, nyDateString } from "@/lib/utils";
import Link from "next/link";

export const metadata = {
  title: "Sector Performance",
  description: "Average daily change, trailing PE, and 90-day history by market sector.",
};

export default async function SectorsPage({
  searchParams,
}: {
  searchParams: Promise<{ sector?: string }>;
}) {
  const { sector: sectorParam } = await searchParams;
  const selected =
    MARKET_SECTORS.find((name) => name.toLowerCase() === (sectorParam ?? "").toLowerCase()) ?? "Technology";
  const today = nyDateString();
  const yesterday = isoDate(addDays(new Date(`${today}T00:00:00Z`), -1));
  const from = isoDate(addDays(new Date(`${today}T00:00:00Z`), -90));
  const [todayRows, yesterdayRows, peToday, peYesterday, historyRaw] = await Promise.all([
    getSectorPerformance(today),
    getSectorPerformance(yesterday),
    getSectorPeSnapshot(today),
    getSectorPeSnapshot(yesterday),
    getHistoricalSectorPerformance(selected, from, today),
  ]);
  const performance = uniqueByPreferUsExchange(todayRows.length ? todayRows : yesterdayRows, (row) => row.sector).sort(
    (a, b) => b.averageChange - a.averageChange,
  );
  const peRows = uniqueByPreferUsExchange(peToday.length ? peToday : peYesterday, (row) => row.sector);
  const peBySector = new Map(peRows.map((row) => [row.sector, row.pe]));
  const rows = performance.map((row) => ({
    ...row,
    pe: peBySector.get(row.sector) ?? null,
  }));
  const history = uniqueByPreferUsExchange(historyRaw, (row) => row.date)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-30);

  return (
    <Container>
      <PageHeader
        title="Sector Performance"
        description="Average daily change and trailing PE by market sector, with a 90-day history for the selected sector."
      />
      <SectionNav items={MARKET_NAV} />
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="sa-table">
          <thead>
            <tr>
              <th>Sector</th>
              <th>Exchange</th>
              <th className="num">PE Ratio</th>
              <th className="num">Avg Change</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.sector}>
                <td>
                  <Link href={sectorHref(row.sector)} className="text-link hover:underline">
                    {row.sector}
                  </Link>
                </td>
                <td className="text-muted">{row.exchange}</td>
                <td className="num">{formatRatio(row.pe)}</td>
                <td className="num">
                  <ChangePercent value={row.averageChange} alreadyPercent />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <section className="mt-10">
        <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
          <h2 className="text-xl font-semibold text-header">{selected} · 90-day average change</h2>
          <Link href="/markets/industries" className="text-sm text-link hover:underline">
            Industry performance
          </Link>
        </div>
        <div className="mb-4 flex flex-wrap gap-2">
          {MARKET_SECTORS.map((name) => (
            <Link
              key={name}
              href={name === "Technology" ? "/markets/sectors" : `/markets/sectors?sector=${encodeURIComponent(name)}`}
              className={cn(
                "rounded-full px-3 py-1 text-sm font-medium",
                name === selected ? "bg-header text-on-header" : "bg-chip text-header hover:bg-border",
              )}
            >
              {name}
            </Link>
          ))}
        </div>
        <HistoryBars
          items={history.map((row) => ({
            label: row.date.slice(5),
            value: row.averageChange,
          }))}
          formatValue={(value) => formatPercent(value, { alreadyPercent: true })}
        />
      </section>
    </Container>
  );
}
