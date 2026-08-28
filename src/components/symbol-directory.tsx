import type { ReactNode } from "react";
import { Container } from "@/components/container";
import { PageHeader } from "@/components/page-header";
import { SectionNav } from "@/components/section-nav";
import { SymbolTable } from "@/components/symbol-table";
import { TablePager } from "@/components/table-pager";
import { withQuoteChanges } from "@/lib/fmp";
import type { NavItem } from "@/lib/nav";
import { TABLE_PAGE_SIZE, pageNumber, paginate, pagerLinks } from "@/lib/paging";
import type { FmpScreenerRow } from "@/lib/types";

export async function SymbolDirectory({
  title,
  description,
  nav,
  hrefBase,
  rows,
  page,
  showIndustry = true,
  actions,
  empty,
}: {
  title: string;
  description: string;
  nav: NavItem[];
  hrefBase: "/stocks" | "/etf" | "/funds";
  rows: FmpScreenerRow[];
  page?: string;
  showIndustry?: boolean;
  actions?: ReactNode;
  empty: string;
}) {
  const sorted = [...rows].sort((a, b) => a.symbol.localeCompare(b.symbol));
  const feed = paginate(sorted, pageNumber(page), TABLE_PAGE_SIZE);
  const quoted = await withQuoteChanges(feed.rows);

  return (
    <Container>
      <PageHeader title={title} description={description} actions={actions} />
      <SectionNav items={nav} />
      <p className="mb-3 text-sm text-muted">
        {sorted.length.toLocaleString("en-US")} symbols, listed alphabetically
      </p>
      <SymbolTable
        hrefBase={hrefBase}
        showIndustry={showIndustry}
        empty={empty}
        rows={quoted.map((row) => ({
          symbol: row.symbol,
          name: row.companyName,
          marketCap: row.marketCap,
          price: row.price,
          changePercentage: row.changePercentage,
          industry: row.industry,
          volume: row.volume,
          isEtf: row.isEtf,
          isFund: row.isFund,
        }))}
      />
      <TablePager
        from={feed.from}
        to={feed.to}
        total={feed.total}
        page={feed.page}
        pageCount={feed.pageCount}
        {...pagerLinks(hrefBase, feed.page, feed.pageCount)}
      />
    </Container>
  );
}
