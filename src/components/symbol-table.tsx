import Link from "next/link";
import { ChangePercent } from "@/components/change";
import { formatCompactUsd, formatInteger, formatPrice } from "@/lib/format";

export type SymbolTableRow = {
  symbol: string;
  name: string;
  marketCap?: number | null;
  price?: number | null;
  changePercentage?: number | null;
  industry?: string | null;
  volume?: number | null;
  exchange?: string | null;
  beta?: number | null;
};

export function SymbolTable({
  rows,
  hrefBase = "/stocks",
  empty = "No results found.",
  showIndustry = true,
}: {
  rows: SymbolTableRow[];
  hrefBase?: string;
  empty?: string;
  showIndustry?: boolean;
}) {
  const colSpan = showIndustry ? 7 : 6;
  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="sa-table">
        <thead>
          <tr>
            <th>Symbol</th>
            <th>Company Name</th>
            <th className="num">Market Cap</th>
            <th className="num">Stock Price</th>
            <th className="num">% Change</th>
            {showIndustry ? <th>Industry</th> : null}
            <th className="num">Volume</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={colSpan} className="text-muted">
                {empty}
              </td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr key={row.symbol}>
                <td className="symbol">
                  <Link href={`${hrefBase}/${row.symbol}`} className="text-link hover:underline">
                    {row.symbol}
                  </Link>
                </td>
                <td className="max-w-[280px] truncate">{row.name}</td>
                <td className="num">{formatCompactUsd(row.marketCap)}</td>
                <td className="num">{formatPrice(row.price)}</td>
                <td className="num">
                  <ChangePercent value={row.changePercentage} />
                </td>
                {showIndustry ? <td className="text-muted">{row.industry || row.exchange || "—"}</td> : null}
                <td className="num">{formatInteger(row.volume)}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
