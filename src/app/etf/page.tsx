import Link from "next/link";
import { Container } from "@/components/container";
import { PageHeader } from "@/components/page-header";
import { SectionNav } from "@/components/section-nav";
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
          <Link href="/screener" className="text-sm text-link hover:underline">
            Stock screener
          </Link>
        }
      />
      <SectionNav
        items={[
          { href: "/list/biggest-companies", label: "Biggest Companies" },
          { href: "/list/nasdaq-stocks", label: "NASDAQ" },
          { href: "/list/nyse-stocks", label: "NYSE" },
          { href: "/etf", label: "ETFs" },
        ]}
      />
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
