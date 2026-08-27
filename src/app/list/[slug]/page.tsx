import { notFound } from "next/navigation";
import { Container } from "@/components/container";
import { PageHeader } from "@/components/page-header";
import { SectionNav } from "@/components/section-nav";
import { SymbolTable } from "@/components/symbol-table";
import { ETF_NAV } from "@/lib/nav";
import { isStockListSlug, LIST_NAV, listHrefBase, loadStockList, STOCK_LISTS } from "@/lib/lists";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!isStockListSlug(slug)) return {};
  const list = STOCK_LISTS[slug];
  return { title: list.title, description: list.description };
}

export default async function StockListPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!isStockListSlug(slug)) notFound();
  const list = STOCK_LISTS[slug];
  const rows = await loadStockList(slug);
  const hrefBase = listHrefBase(slug);
  const isEtfList = hrefBase === "/etf";

  return (
    <Container>
      <PageHeader title={list.title} description={list.description} />
      <SectionNav items={isEtfList ? ETF_NAV : LIST_NAV} />
      <p className="mb-3 text-sm text-muted">
        {rows.length} {isEtfList ? "ETFs" : "stocks"}
      </p>
      <SymbolTable
        rows={rows}
        hrefBase={hrefBase}
        showYield={
          ("sort" in list && list.sort === "dividendYield") ||
          slug === "monthly-dividend-stocks" ||
          slug === "bond-etfs"
        }
        showFounded={slug === "oldest-companies"}
        showCountry={list.category === "international" || slug === "foreign-stocks"}
      />
    </Container>
  );
}
