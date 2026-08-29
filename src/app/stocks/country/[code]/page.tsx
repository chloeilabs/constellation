import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Container } from "@/components/container";
import { PageHeader } from "@/components/page-header";
import { SectionNav } from "@/components/section-nav";
import { SymbolTable } from "@/components/symbol-table";
import { STOCKS_NAV } from "@/lib/nav";
import { findCountryMarket, loadCountryStocks } from "@/lib/countries";
import { formatInteger } from "@/lib/format";

export async function generateMetadata({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const market = findCountryMarket(code);
  if (!market) return {};
  return {
    title: `${market.name} Stocks`,
    description: `The largest companies listed on the ${market.exchangeName}, ranked by market capitalization.`,
  };
}

export default async function CountryStocksPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  if (code.toLowerCase() === "us") redirect("/stocks");
  const detail = await loadCountryStocks(code);
  if (!detail) notFound();
  const { market, rows } = detail;

  return (
    <Container>
      <PageHeader
        title={`${market.name} Stocks`}
        description={`The largest ${formatInteger(rows.length)} listings on the ${market.exchangeName}, ranked by market cap from the live FMP screener.`}
      />
      <SectionNav items={STOCKS_NAV} />
      <p className="mb-3 text-sm text-muted">
        <Link href="/stocks/country" className="text-link hover:underline">
          All countries
        </Link>
        {market.listSlug ? (
          <>
            {" · "}
            <Link href={`/list/${market.listSlug}`} className="text-link hover:underline">
              Matching list
            </Link>
          </>
        ) : null}
        {" · "}
        <Link
          href={`/screener?${new URLSearchParams({
            ...(market.country ? { country: market.country } : {}),
            ...(market.exchange ? { exchange: market.exchange } : {}),
          }).toString()}`}
          className="text-link hover:underline"
        >
          Open screener
        </Link>
      </p>
      <SymbolTable
        localCurrency
        empty={`No actively traded listings found for ${market.name}.`}
        rows={rows.map((row) => ({
          symbol: row.symbol,
          name: row.companyName,
          marketCap: row.marketCap,
          price: row.price,
          changePercentage: row.changePercentage,
          industry: row.industry,
          volume: row.volume,
          country: row.country,
          exchange: row.exchange,
        }))}
      />
    </Container>
  );
}
