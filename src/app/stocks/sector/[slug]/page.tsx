import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/container";
import { PageHeader } from "@/components/page-header";
import { SectionNav } from "@/components/section-nav";
import { MetricCards } from "@/components/metric-cards";
import { SymbolTable } from "@/components/symbol-table";
import { ChangePercent } from "@/components/change";
import { STOCKS_NAV } from "@/lib/nav";
import { formatCompactUsd, formatInteger, formatPercentPlain, formatRatio } from "@/lib/format";
import { loadSectorDetail, resolveSectorSlug } from "@/lib/industries";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const name = (await resolveSectorSlug(slug)) ?? slug;
  return {
    title: `${name} Sector Stocks`,
    description: `Companies in the ${name} sector, ranked by market capitalization.`,
  };
}

export default async function SectorDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const sector = await resolveSectorSlug(slug);
  if (!sector) notFound();
  const detail = await loadSectorDetail(sector);

  return (
    <Container>
      <PageHeader
        title={`${sector} Sector Stocks`}
        description={`The ${sector} sector has ${formatInteger(detail.stocks)} listed stocks, with a combined market cap of ${formatCompactUsd(detail.marketCap)}.`}
      />
      <SectionNav items={STOCKS_NAV} />
      <MetricCards
        items={[
          { label: "Stocks", value: formatInteger(detail.stocks) },
          { label: "Market Cap", value: formatCompactUsd(detail.marketCap) },
          { label: "PE Ratio", value: formatRatio(detail.pe) },
          {
            label: "Avg Change",
            value:
              detail.averageChange == null ? (
                "—"
              ) : (
                <ChangePercent value={detail.averageChange} alreadyPercent className="text-2xl" />
              ),
          },
          {
            label: "Avg Yield",
            value: detail.averageYield == null ? "—" : formatPercentPlain(detail.averageYield, { alreadyPercent: true }),
          },
        ]}
      />

      {detail.industries.length > 0 ? (
        <section className="mt-10">
          <h2 className="mb-3 text-lg font-semibold text-header">Industries</h2>
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="sa-table">
              <thead>
                <tr>
                  <th>Industry</th>
                  <th className="num">Stocks</th>
                  <th className="num">Market Cap</th>
                </tr>
              </thead>
              <tbody>
                {detail.industries.map((industry) => (
                  <tr key={industry.slug}>
                    <td>
                      <Link href={`/stocks/industry/${industry.slug}`} className="text-link hover:underline">
                        {industry.name}
                      </Link>
                    </td>
                    <td className="num">{formatInteger(industry.stocks)}</td>
                    <td className="num">{formatCompactUsd(industry.marketCap)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      <section className="mt-10">
        <h2 className="mb-3 text-lg font-semibold text-header">Largest {sector} Stocks</h2>
        <p className="mb-3 text-sm text-muted">
          Top {formatInteger(detail.rows.length)} of {formatInteger(detail.stocks)} U.S.-primary listings by market cap.
        </p>
        <SymbolTable
          empty={`No actively traded listings found for ${sector}.`}
          rows={detail.rows.map((row) => ({
            symbol: row.symbol,
            name: row.companyName,
            marketCap: row.marketCap,
            price: row.price,
            changePercentage: row.changePercentage,
            industry: row.industry,
            volume: row.volume,
          }))}
        />
      </section>
    </Container>
  );
}
