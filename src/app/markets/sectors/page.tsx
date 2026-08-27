import { Container } from "@/components/container";
import { PageHeader } from "@/components/page-header";
import { ChangePercent } from "@/components/change";
import { SectionNav } from "@/components/section-nav";
import { MARKET_NAV } from "@/lib/nav";
import { formatRatio } from "@/lib/format";
import { getSectorPeSnapshot, getSectorPerformance } from "@/lib/fmp";
import { industrySlug } from "@/lib/industries";
import { addDays, isoDate, nyDateString } from "@/lib/utils";
import Link from "next/link";

export const metadata = {
  title: "Sector Performance",
  description: "Average daily change and trailing PE by market sector.",
};

export default async function SectorsPage() {
  const today = nyDateString();
  const yesterday = isoDate(addDays(new Date(`${today}T00:00:00Z`), -1));
  const [todayRows, yesterdayRows, peToday, peYesterday] = await Promise.all([
    getSectorPerformance(today),
    getSectorPerformance(yesterday),
    getSectorPeSnapshot(today),
    getSectorPeSnapshot(yesterday),
  ]);
  const performance = [...(todayRows.length ? todayRows : yesterdayRows)].sort(
    (a, b) => b.averageChange - a.averageChange,
  );
  const peRows = peToday.length ? peToday : peYesterday;
  const peBySector = new Map(peRows.map((row) => [row.sector, row.pe]));
  const rows = performance.map((row) => ({
    ...row,
    pe: peBySector.get(row.sector) ?? null,
  }));

  return (
    <Container>
      <PageHeader title="Sector Performance" description="Average daily change and trailing PE by market sector." />
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
              <tr key={`${row.sector}-${row.exchange}`}>
                <td>
                  <Link href={`/stocks/industry#${industrySlug(row.sector)}`} className="text-link hover:underline">
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
    </Container>
  );
}
