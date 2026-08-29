import Link from "next/link";
import { Container } from "@/components/container";
import { PageHeader } from "@/components/page-header";
import { ChangePercent } from "@/components/change";
import { SectionNav } from "@/components/section-nav";
import { MARKET_NAV } from "@/lib/nav";
import { formatRatio } from "@/lib/format";
import { getIndustryPeSnapshot, getIndustryPerformance } from "@/lib/fmp";
import { industrySlug, uniqueByPreferUsExchange } from "@/lib/industries";
import { addDays, isoDate, nyDateString } from "@/lib/utils";

export const metadata = {
  title: "Industry Performance",
  description: "Average daily change and trailing PE by industry from Financial Modeling Prep.",
};

export default async function IndustryPerformancePage() {
  const today = nyDateString();
  const yesterday = isoDate(addDays(new Date(`${today}T00:00:00Z`), -1));
  const [todayRows, yesterdayRows, peToday, peYesterday] = await Promise.all([
    getIndustryPerformance(today),
    getIndustryPerformance(yesterday),
    getIndustryPeSnapshot(today),
    getIndustryPeSnapshot(yesterday),
  ]);
  const performance = uniqueByPreferUsExchange(
    todayRows.length ? todayRows : yesterdayRows,
    (row) => row.industry,
  ).sort((a, b) => b.averageChange - a.averageChange);
  const peRows = uniqueByPreferUsExchange(peToday.length ? peToday : peYesterday, (row) => row.industry);
  const peByIndustry = new Map(peRows.map((row) => [row.industry, row.pe]));
  const rows = performance.map((row) => ({
    ...row,
    pe: peByIndustry.get(row.industry) ?? null,
  }));

  return (
    <Container>
      <PageHeader
        title="Industry Performance"
        description="Average daily change and trailing PE for U.S. industries, using the latest FMP industry snapshot."
        actions={
          <Link href="/stocks/industry" className="text-sm text-link hover:underline">
            Browse by sector
          </Link>
        }
      />
      <SectionNav items={MARKET_NAV} />
      <p className="mb-3 text-sm text-muted">{rows.length} industries</p>
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="sa-table">
          <thead>
            <tr>
              <th>Industry</th>
              <th>Exchange</th>
              <th className="num">PE Ratio</th>
              <th className="num">Avg Change</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.industry}>
                <td>
                  <Link href={`/stocks/industry/${industrySlug(row.industry)}`} className="text-link hover:underline">
                    {row.industry}
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
