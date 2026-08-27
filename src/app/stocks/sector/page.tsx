import Link from "next/link";
import { Container } from "@/components/container";
import { PageHeader } from "@/components/page-header";
import { SectionNav } from "@/components/section-nav";
import { ChangePercent } from "@/components/change";
import { STOCKS_NAV } from "@/lib/nav";
import { formatRatio } from "@/lib/format";
import { getSectorPeSnapshot, getSectorPerformance } from "@/lib/fmp";
import { MARKET_SECTORS, sectorHref, uniqueByPreferUsExchange } from "@/lib/industries";
import { addDays, isoDate, nyDateString } from "@/lib/utils";

export const metadata = {
  title: "Stock Market Sectors",
  description: "U.S. stock market sectors with live FMP PE ratios and average daily change.",
};

export default async function SectorsIndexPage() {
  const today = nyDateString();
  const yesterday = isoDate(addDays(new Date(`${today}T00:00:00Z`), -1));
  const [perfToday, perfYesterday, peToday, peYesterday] = await Promise.all([
    getSectorPerformance(today),
    getSectorPerformance(yesterday),
    getSectorPeSnapshot(today),
    getSectorPeSnapshot(yesterday),
  ]);
  const performance = uniqueByPreferUsExchange(perfToday.length ? perfToday : perfYesterday, (row) => row.sector);
  const peRows = uniqueByPreferUsExchange(peToday.length ? peToday : peYesterday, (row) => row.sector);
  const peBySector = new Map(peRows.map((row) => [row.sector, row.pe]));
  const changeBySector = new Map(performance.map((row) => [row.sector, row.averageChange]));
  const names = performance.length ? performance.map((row) => row.sector) : [...MARKET_SECTORS];

  return (
    <Container>
      <PageHeader
        title="Stock Market Sectors"
        description="Open a sector for the largest U.S.-listed stocks and industry breakdown from live FMP data."
      />
      <SectionNav items={STOCKS_NAV} />
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="sa-table">
          <thead>
            <tr>
              <th>Sector</th>
              <th className="num">PE Ratio</th>
              <th className="num">Avg Change</th>
            </tr>
          </thead>
          <tbody>
            {names.map((name) => (
              <tr key={name}>
                <td>
                  <Link href={sectorHref(name)} className="text-link hover:underline">
                    {name}
                  </Link>
                </td>
                <td className="num">{formatRatio(peBySector.get(name) ?? null)}</td>
                <td className="num">
                  <ChangePercent value={changeBySector.get(name) ?? null} alreadyPercent />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-4 text-sm text-muted">
        See every industry grouped under these sectors on{" "}
        <Link href="/stocks/industry" className="text-link hover:underline">
          Sectors & Industries
        </Link>
        , or 90-day history on{" "}
        <Link href="/markets/sectors" className="text-link hover:underline">
          sector performance
        </Link>
        .
      </p>
    </Container>
  );
}
