import Link from "next/link";
import { Container } from "@/components/container";
import { PageHeader } from "@/components/page-header";
import { SectionNav } from "@/components/section-nav";
import { ChangePercent } from "@/components/change";
import { STOCKS_NAV } from "@/lib/nav";
import { formatCompactUsd, formatInteger, formatRatio } from "@/lib/format";
import { loadIndustryDirectory, sectorHref } from "@/lib/industries";

export const metadata = {
  title: "Stock Market Sectors and Industries",
  description: "Browse U.S.-listed stocks grouped by sector and industry, with combined market cap and daily performance.",
};

export default async function IndustriesPage() {
  const sectors = await loadIndustryDirectory();
  const industryCount = sectors.reduce((sum, sector) => sum + sector.industries.length, 0);

  return (
    <Container>
      <PageHeader
        title="Sectors & Industries"
        description={`Stocks grouped into ${sectors.length} sectors and ${industryCount} industries, based on each company's primary business.`}
      />
      <SectionNav items={STOCKS_NAV} />
      <div className="mb-8 flex flex-wrap gap-2 text-sm">
        {sectors.map((sector) => (
          <a
            key={sector.slug}
            href={`#${sector.slug}`}
            className="rounded-full bg-chip px-3 py-1 font-medium text-header hover:bg-border"
          >
            {sector.name}
          </a>
        ))}
      </div>
      <div className="flex flex-col gap-12">
        {sectors.map((sector) => (
          <section key={sector.slug} id={sector.slug} className="scroll-mt-24">
            <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
              <h2 className="text-xl font-semibold text-header">
                <Link href={sectorHref(sector.name)} className="hover:text-link hover:underline">
                  {sector.name}
                </Link>
              </h2>
              <p className="text-sm text-muted">
                {formatInteger(sector.stocks)} stocks · {formatCompactUsd(sector.marketCap)} combined cap
              </p>
            </div>
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="sa-table">
                <thead>
                  <tr>
                    <th>Industry</th>
                    <th className="num">Stocks</th>
                    <th className="num">Market Cap</th>
                    <th className="num">PE Ratio</th>
                    <th className="num">1D Change</th>
                  </tr>
                </thead>
                <tbody>
                  {sector.industries.map((industry) => (
                    <tr key={industry.slug}>
                      <td>
                        <Link href={`/stocks/industry/${industry.slug}`} className="text-link hover:underline">
                          {industry.name}
                        </Link>
                      </td>
                      <td className="num">{formatInteger(industry.stocks)}</td>
                      <td className="num">{formatCompactUsd(industry.marketCap)}</td>
                      <td className="num">{formatRatio(industry.pe)}</td>
                      <td className="num">
                        <ChangePercent value={industry.averageChange} alreadyPercent />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ))}
      </div>
    </Container>
  );
}
