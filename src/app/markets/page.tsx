import Link from "next/link";
import { Container } from "@/components/container";
import { IndexTicker } from "@/components/index-ticker";
import { MoversTable } from "@/components/movers-table";
import { PageHeader } from "@/components/page-header";
import { ChangePercent } from "@/components/change";
import { SectionNav, MARKET_NAV } from "@/components/section-nav";
import { getGainers, getIndexQuotes, getLosers, getMarketHours, getMostActive, getSectorPerformance } from "@/lib/fmp";
import { addDays, isoDate, nyDateString } from "@/lib/utils";

export default async function MarketsPage() {
  const today = nyDateString();
  const yesterday = isoDate(addDays(new Date(`${today}T00:00:00Z`), -1));
  const [indexes, gainers, losers, active, sectorsToday, sectorsYesterday, hours] = await Promise.all([
    getIndexQuotes(),
    getGainers(),
    getLosers(),
    getMostActive(),
    getSectorPerformance(today),
    getSectorPerformance(yesterday),
    getMarketHours("NASDAQ"),
  ]);
  const sectors = sectorsToday.length ? sectorsToday : sectorsYesterday;

  return (
    <>
      <IndexTicker quotes={indexes} hours={hours} />
      <Container>
        <PageHeader title="Stock Market" description="Indexes, movers, and sector performance." />
        <SectionNav items={MARKET_NAV} />
        <div className="grid gap-8 lg:grid-cols-3">
          <MoversTable title="Top Gainers" href="/markets/gainers" rows={gainers.slice(0, 8)} />
          <MoversTable title="Top Losers" href="/markets/losers" rows={losers.slice(0, 8)} />
          <MoversTable title="Most Active" href="/markets/active" rows={active.slice(0, 8)} />
        </div>
        <section className="mt-12">
          <div className="mb-3 flex items-end justify-between">
            <h2 className="text-xl font-semibold text-header">Sector Performance</h2>
            <Link href="/markets/sectors" className="text-sm text-link hover:underline">
              Full table
            </Link>
          </div>
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="sa-table">
              <thead>
                <tr>
                  <th>Sector</th>
                  <th className="num">Avg Change</th>
                </tr>
              </thead>
              <tbody>
                {sectors.length === 0 ? (
                  <tr>
                    <td colSpan={2} className="text-muted">
                      Sector snapshot is unavailable for the latest session.
                    </td>
                  </tr>
                ) : (
                  [...sectors]
                    .sort((a, b) => b.averageChange - a.averageChange)
                    .map((row) => (
                      <tr key={row.sector}>
                        <td>{row.sector}</td>
                        <td className="num">
                          <ChangePercent value={row.averageChange} alreadyPercent />
                        </td>
                      </tr>
                    ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </Container>
    </>
  );
}
