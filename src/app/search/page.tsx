import Link from "next/link";
import { Container } from "@/components/container";
import { PageHeader } from "@/components/page-header";
import { SearchBox } from "@/components/search-box";
import { searchAll } from "@/lib/fmp";
import { quoteHref, quoteKind } from "@/lib/listings";

export async function generateMetadata({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const query = (q ?? "").trim();
  return {
    title: query ? `Search: ${query}` : "Search",
    description: "Search stocks, ETFs, funds, companies, CIK, CUSIP, and ISIN with live Financial Modeling Prep listings.",
  };
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = (q ?? "").trim();
  const results = query ? await searchAll(query, 25) : [];

  return (
    <Container>
      <PageHeader title={query ? `Search: ${query}` : "Search"} description="Find stocks, indexes, ETFs, funds, companies, CIK, CUSIP, or ISIN." />
      <div className="mb-6 max-w-xl">
        <SearchBox large autoFocus={!query} />
      </div>
      {query ? (
        results.length === 0 ? (
          <p className="text-sm text-muted">No matches for “{query}”.</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="sa-table">
              <thead>
                <tr>
                  <th>Symbol</th>
                  <th>Name</th>
                  <th>Type</th>
                  <th>Exchange</th>
                </tr>
              </thead>
              <tbody>
                {results.map((row) => (
                  <tr key={`${row.symbol}-${row.exchange}`}>
                    <td className="symbol">
                      <Link href={quoteHref(row.symbol, row)} className="text-link hover:underline">
                        {row.symbol}
                      </Link>
                    </td>
                    <td>{row.name}</td>
                    <td className="text-muted">{quoteKind(row.symbol, row)}</td>
                    <td className="text-muted">{row.exchangeFullName || row.exchange}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      ) : (
        <p className="text-sm text-muted">Type a ticker, company name, CIK, CUSIP, or ISIN to search live FMP listings.</p>
      )}
    </Container>
  );
}
