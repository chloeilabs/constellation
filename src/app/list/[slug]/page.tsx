import { notFound } from "next/navigation";
import { Container } from "@/components/container";
import { PageHeader } from "@/components/page-header";
import { SectionNav } from "@/components/section-nav";
import { SymbolTable } from "@/components/symbol-table";
import { getScreener, withQuoteChanges } from "@/lib/fmp";
import { preferPrimaryListings } from "@/lib/listings";
import { isStockListSlug, STOCK_LISTS } from "@/lib/lists";

export default async function StockListPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!isStockListSlug(slug)) notFound();
  const list = STOCK_LISTS[slug];
  const raw = await getScreener(list.filters, { limit: list.limit });
  const sorted = preferPrimaryListings(raw);
  const rows = await withQuoteChanges(sorted);

  return (
    <Container>
      <PageHeader title={list.title} description={list.description} />
      <SectionNav
        items={[
          { href: "/list/biggest-companies", label: "Biggest Companies" },
          { href: "/list/nasdaq-stocks", label: "NASDAQ" },
          { href: "/list/nyse-stocks", label: "NYSE" },
          { href: "/etf", label: "ETFs" },
          { href: "/screener", label: "Screener" },
        ]}
      />
      <p className="mb-3 text-sm text-muted">{rows.length} stocks</p>
      <SymbolTable
        rows={rows.map((row) => ({
          symbol: row.symbol,
          name: row.companyName,
          marketCap: row.marketCap,
          price: row.price,
          changePercentage: row.changePercentage,
          industry: row.industry,
          volume: row.volume,
        }))}
      />
    </Container>
  );
}
