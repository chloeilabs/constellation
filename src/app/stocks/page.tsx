import Link from "next/link";
import { Container } from "@/components/container";
import { PageHeader } from "@/components/page-header";
import { formatCompactUsd, formatInteger, formatPrice } from "@/lib/format";
import { getScreener } from "@/lib/fmp";

export default async function StocksListPage() {
  const rows = await getScreener({ country: "US" }, { limit: 50 });
  const sorted = [...rows].sort((a, b) => (b.marketCap ?? 0) - (a.marketCap ?? 0));

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
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="sa-table">
          <thead>
            <tr>
              <th>Symbol</th>
              <th>Company</th>
              <th className="num">Market Cap</th>
              <th className="num">Price</th>
              <th>Industry</th>
              <th className="num">Volume</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((row) => (
              <tr key={row.symbol}>
                <td className="symbol">
                  <Link href={`/stocks/${row.symbol}`} className="text-link hover:underline">
                    {row.symbol}
                  </Link>
                </td>
                <td>{row.companyName}</td>
                <td className="num">{formatCompactUsd(row.marketCap)}</td>
                <td className="num">{formatPrice(row.price)}</td>
                <td className="text-muted">{row.industry}</td>
                <td className="num">{formatInteger(row.volume)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Container>
  );
}
