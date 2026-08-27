import Link from "next/link";
import { Container } from "@/components/container";
import { PageHeader } from "@/components/page-header";
import { SectionNav } from "@/components/section-nav";
import { ETF_NAV } from "@/lib/nav";
import { SymbolTable } from "@/components/symbol-table";
import { getScreener, withQuoteChanges } from "@/lib/fmp";
import { preferPrimaryListings } from "@/lib/listings";

export default async function EtfListPage() {
  const raw = await getScreener({ isEtf: true, isFund: false, country: "US" }, { limit: 100 });
  const sorted = preferPrimaryListings(raw).slice(0, 50);
  const rows = await withQuoteChanges(sorted);

  return (
    <Container>
      <PageHeader
        title="Exchange Traded Funds"
        description="Largest U.S. ETFs by market value, with live quotes from Financial Modeling Prep."
        actions={
          <div className="flex gap-4 text-sm">
            <Link href="/etf/compare" className="text-link hover:underline">
              Compare ETFs
            </Link>
            <Link href="/etf/lookup" className="text-link hover:underline">
              Reverse ETF lookup
            </Link>
          </div>
        }
      />
      <SectionNav items={ETF_NAV} />
      <SymbolTable
        hrefBase="/etf"
        showIndustry={false}
        empty="No ETF data available."
        rows={rows.map((row) => ({
          symbol: row.symbol,
          name: row.companyName,
          marketCap: row.marketCap,
          price: row.price,
          changePercentage: row.changePercentage,
          volume: row.volume,
        }))}
      />
    </Container>
  );
}
