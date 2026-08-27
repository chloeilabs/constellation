import Link from "next/link";
import { Container } from "@/components/container";
import { PageHeader } from "@/components/page-header";
import { SectionNav } from "@/components/section-nav";
import { STOCKS_NAV } from "@/lib/nav";
import { SymbolTable } from "@/components/symbol-table";
import { getScreener, withQuoteChanges } from "@/lib/fmp";
import { preferPrimaryListings } from "@/lib/listings";

export default async function StocksListPage() {
  const raw = await getScreener({ country: "US" }, { limit: 100 });
  const sorted = preferPrimaryListings(raw).slice(0, 50);
  const rows = await withQuoteChanges(sorted);

  return (
    <Container>
      <PageHeader
        title="Stocks"
        description="Largest actively traded U.S. stocks by market cap."
        actions={
          <Link href="/screener" className="text-sm text-link hover:underline">
            Open screener
          </Link>
        }
      />
      <SectionNav items={STOCKS_NAV} />
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
