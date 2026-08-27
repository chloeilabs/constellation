import { Container } from "@/components/container";
import { PageHeader } from "@/components/page-header";
import { ChangePercent } from "@/components/change";
import { SectionNav } from "@/components/section-nav";
import { MARKET_NAV } from "@/lib/nav";
import { getSectorPerformance } from "@/lib/fmp";
import { addDays, isoDate, nyDateString } from "@/lib/utils";

export default async function SectorsPage() {
  const today = nyDateString();
  const yesterday = isoDate(addDays(new Date(`${today}T00:00:00Z`), -1));
  const [todayRows, yesterdayRows] = await Promise.all([
    getSectorPerformance(today),
    getSectorPerformance(yesterday),
  ]);
  const rows = [...(todayRows.length ? todayRows : yesterdayRows)].sort(
    (a, b) => b.averageChange - a.averageChange,
  );

  return (
    <Container>
      <PageHeader title="Sector Performance" description="Average daily change by market sector." />
      <SectionNav items={MARKET_NAV} />
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="sa-table">
          <thead>
            <tr>
              <th>Sector</th>
              <th>Exchange</th>
              <th className="num">Avg Change</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={`${row.sector}-${row.exchange}`}>
                <td>{row.sector}</td>
                <td className="text-muted">{row.exchange}</td>
                <td className="num">
                  <ChangePercent value={row.averageChange} alreadyPercent />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Container>
  );
}
