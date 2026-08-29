import { notFound } from "next/navigation";
import { Container } from "@/components/container";
import { PageHeader } from "@/components/page-header";
import { SectionNav } from "@/components/section-nav";
import { MetricCards } from "@/components/metric-cards";
import { SymbolTable } from "@/components/symbol-table";
import { ChangePercent } from "@/components/change";
import { STOCKS_NAV } from "@/lib/nav";
import { formatCompactUsd, formatInteger } from "@/lib/format";
import { industryMetrics, loadIndustryStocks, resolveIndustrySlug } from "@/lib/industries";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const industry = await resolveIndustrySlug(slug);
  const name = industry ?? slug;
  return {
    title: `${name} Stocks`,
    description: `Companies in the ${name} industry, ranked by market capitalization.`,
  };
}

export default async function IndustryDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const industry = await resolveIndustrySlug(slug);
  if (!industry) notFound();
  const rows = await loadIndustryStocks(industry);
  const metrics = industryMetrics(rows);

  return (
    <Container>
      <PageHeader
        title={industry}
        description={`The ${industry} industry has ${formatInteger(metrics.stocks)} listed stocks, with a combined market cap of ${formatCompactUsd(metrics.marketCap)}.`}
      />
      <SectionNav items={STOCKS_NAV} />
      <MetricCards
        items={[
          { label: "Stocks", value: formatInteger(metrics.stocks) },
          { label: "Market Cap", value: formatCompactUsd(metrics.marketCap) },
          {
            label: "Avg Change",
            value:
              metrics.averageChange == null ? (
                "—"
              ) : (
                <ChangePercent value={metrics.averageChange} alreadyPercent className="text-2xl" />
              ),
          },
        ]}
      />
      <section className="mt-10">
        <h2 className="mb-3 text-lg font-semibold text-header">{formatInteger(metrics.stocks)} Stocks</h2>
        <SymbolTable
          empty={`No actively traded listings found for ${industry}.`}
          rows={rows.map((row) => ({
            symbol: row.symbol,
            name: row.companyName,
            marketCap: row.marketCap,
            price: row.price,
            changePercentage: row.changePercentage,
            industry: row.exchangeShortName || row.exchange,
            volume: row.volume,
          }))}
          showIndustry={false}
        />
      </section>
    </Container>
  );
}
