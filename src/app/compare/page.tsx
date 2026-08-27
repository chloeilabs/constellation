import Link from "next/link";
import { Container } from "@/components/container";
import { PageHeader } from "@/components/page-header";
import { ChangePercent } from "@/components/change";
import { formatCompactUsd, formatPrice, formatRatio } from "@/lib/format";
import { getProfilesAndQuotes } from "@/lib/compare";

export default async function ComparePage({
  searchParams,
}: {
  searchParams: Promise<{ symbols?: string }>;
}) {
  const { symbols: raw } = await searchParams;
  const symbols = (raw ?? "AAPL,MSFT,GOOGL")
    .split(",")
    .map((symbol) => symbol.trim().toUpperCase())
    .filter(Boolean)
    .slice(0, 4);
  const rows = await getProfilesAndQuotes(symbols);

  return (
    <Container>
      <PageHeader
        title="Compare Stocks"
        description="Side-by-side quotes and company data."
        actions={
          <form className="flex gap-2">
            <input
              name="symbols"
              defaultValue={symbols.join(",")}
              placeholder="AAPL,MSFT,NVDA"
              className="h-9 w-56 rounded-md border border-border px-2 text-sm"
            />
            <button className="h-9 rounded-md bg-header px-3 text-sm font-medium text-white" type="submit">
              Compare
            </button>
          </form>
        }
      />
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="sa-table">
          <thead>
            <tr>
              <th>Metric</th>
              {rows.map((row) => (
                <th key={row.symbol} className="num">
                  <Link href={`/stocks/${row.symbol}`} className="text-link hover:underline">
                    {row.symbol}
                  </Link>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Name</td>
              {rows.map((row) => (
                <td key={row.symbol} className="num">
                  {row.profile?.companyName ?? row.quote?.name ?? "—"}
                </td>
              ))}
            </tr>
            <tr>
              <td>Price</td>
              {rows.map((row) => (
                <td key={row.symbol} className="num">
                  {formatPrice(row.quote?.price)}
                </td>
              ))}
            </tr>
            <tr>
              <td>Change</td>
              {rows.map((row) => (
                <td key={row.symbol} className="num">
                  <ChangePercent value={row.quote?.changePercentage} />
                </td>
              ))}
            </tr>
            <tr>
              <td>Market Cap</td>
              {rows.map((row) => (
                <td key={row.symbol} className="num">
                  {formatCompactUsd(row.quote?.marketCap ?? row.profile?.marketCap)}
                </td>
              ))}
            </tr>
            <tr>
              <td>Sector</td>
              {rows.map((row) => (
                <td key={row.symbol} className="num">
                  {row.profile?.sector ?? "—"}
                </td>
              ))}
            </tr>
            <tr>
              <td>Industry</td>
              {rows.map((row) => (
                <td key={row.symbol} className="num">
                  {row.profile?.industry ?? "—"}
                </td>
              ))}
            </tr>
            <tr>
              <td>Beta</td>
              {rows.map((row) => (
                <td key={row.symbol} className="num">
                  {formatRatio(row.profile?.beta)}
                </td>
              ))}
            </tr>
            <tr>
              <td>52-Week Range</td>
              {rows.map((row) => (
                <td key={row.symbol} className="num">
                  {row.quote ? `${formatPrice(row.quote.yearLow)} - ${formatPrice(row.quote.yearHigh)}` : "—"}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </Container>
  );
}
