import Link from "next/link";
import { Container } from "@/components/container";
import { PageHeader } from "@/components/page-header";
import { SectionNav } from "@/components/section-nav";
import { SymbolTable } from "@/components/symbol-table";
import { getScreener, withQuoteChanges } from "@/lib/fmp";

export default async function FundsPage() {
  const raw = await getScreener({ isFund: true, isEtf: false, country: "US" }, { limit: 80 });
  const ranked = [...raw].sort((a, b) => (b.marketCap ?? 0) - (a.marketCap ?? 0)).slice(0, 50);
  const rows = await withQuoteChanges(ranked);

  return (
    <Container>
      <PageHeader
        title="Mutual Funds"
        description="Largest U.S. mutual funds by assets, with live prices from Financial Modeling Prep."
        actions={
          <Link href="/etf" className="text-sm text-link hover:underline">
            Largest ETFs
          </Link>
        }
      />
      <SectionNav
        items={[
          { href: "/list/biggest-companies", label: "Biggest Companies" },
          { href: "/etf", label: "ETFs" },
          { href: "/funds", label: "Mutual Funds" },
        ]}
      />
      <SymbolTable
        hrefBase="/stocks"
        showIndustry={false}
        empty="No mutual fund data available."
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
