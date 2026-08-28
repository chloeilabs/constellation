import { notFound, redirect } from "next/navigation";
import { Container } from "@/components/container";
import { PageHeader } from "@/components/page-header";
import { SectionNav } from "@/components/section-nav";
import { SymbolTable } from "@/components/symbol-table";
import { ETF_NAV } from "@/lib/nav";
import { LIST_NAV, listHrefBase, loadStockList, resolveListPath, resolveStockListSlug, STOCK_LISTS } from "@/lib/lists";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const resolved = resolveStockListSlug(slug);
  if (!resolved) return {};
  const list = STOCK_LISTS[resolved];
  return { title: list.title, description: list.description };
}

export default async function StockListPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const pathAlias = resolveListPath(slug);
  if (pathAlias) redirect(pathAlias);
  const resolved = resolveStockListSlug(slug);
  if (!resolved) notFound();
  const list = STOCK_LISTS[resolved];
  const rows = await loadStockList(resolved);
  const hrefBase = listHrefBase(resolved);
  const isEtfList = hrefBase === "/etf";
  const noun = hrefBase === "/etf" ? "ETFs" : hrefBase === "/funds" ? "funds" : "stocks";
  const showYield =
    ("sort" in list && list.sort === "dividendYield") ||
    list.source === "dividend-frequency" ||
    resolved === "bond-etfs" ||
    resolved === "dividend-etfs" ||
    resolved === "dividend-aristocrats" ||
    resolved === "dividend-kings" ||
    resolved === "reit-stocks" ||
    resolved === "highest-dividend" ||
    resolved === "bdc-stocks" ||
    resolved === "cef-funds" ||
    resolved === "preferred-stocks" ||
    resolved === "top-rated-dividend-stocks" ||
    resolved === "australian-etfs" ||
    resolved === "canadian-etfs";

  return (
    <Container>
      <PageHeader title={list.title} description={list.description} />
      <SectionNav items={isEtfList ? ETF_NAV : LIST_NAV} />
      <p className="mb-3 text-sm text-muted">
        {rows.length} {noun}
      </p>
      <SymbolTable
        rows={rows}
        hrefBase={hrefBase}
        showYield={showYield}
        showFounded={resolved === "oldest-companies"}
        showCountry={list.category === "international" || ("source" in list && list.source === "foreign-us")}
        localCurrency={
          list.category === "international" || resolved === "australian-etfs" || resolved === "canadian-etfs"
        }
        showRevenue={resolved === "highest-revenue"}
        showProfit={resolved === "highest-profit"}
        showEmployees={resolved === "highest-employees"}
        showTax={resolved === "highest-taxes"}
        showRating={resolved === "top-rated" || resolved === "top-rated-dividend-stocks"}
      />
    </Container>
  );
}
