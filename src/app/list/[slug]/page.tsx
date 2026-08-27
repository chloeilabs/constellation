import { notFound } from "next/navigation";
import { Container } from "@/components/container";
import { PageHeader } from "@/components/page-header";
import { SectionNav } from "@/components/section-nav";
import { SymbolTable } from "@/components/symbol-table";
import { isStockListSlug, LIST_NAV, loadStockList, STOCK_LISTS } from "@/lib/lists";

export default async function StockListPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!isStockListSlug(slug)) notFound();
  const list = STOCK_LISTS[slug];
  const rows = await loadStockList(slug);

  return (
    <Container>
      <PageHeader title={list.title} description={list.description} />
      <SectionNav items={LIST_NAV} />
      <p className="mb-3 text-sm text-muted">{rows.length} stocks</p>
      <SymbolTable rows={rows} showYield={slug === "highest-dividend"} />
    </Container>
  );
}
