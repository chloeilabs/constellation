import Link from "next/link";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { congressSide, politicianName, type CongressTradeRow } from "@/lib/congress";

export function CongressTable({
  rows,
  showSymbol = true,
  empty = "No congressional trades in this window.",
}: {
  rows: CongressTradeRow[];
  showSymbol?: boolean;
  empty?: string;
}) {
  const colSpan = showSymbol ? 8 : 7;
  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="sa-table">
        <thead>
          <tr>
            <th>Trade Date</th>
            {showSymbol ? <th>Symbol</th> : null}
            <th>Politician</th>
            <th>Chamber</th>
            <th>Type</th>
            <th>Amount</th>
            <th>Asset</th>
            <th>Filed</th>
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
            rows.map((row, index) => {
              const side = congressSide(row.type);
              const name = politicianName(row);
              return (
                <tr key={`${row.chamber}-${row.symbol}-${row.transactionDate}-${row.link}-${index}`}>
                  <td>{formatDate(row.transactionDate)}</td>
                  {showSymbol ? (
                    <td className="symbol">
                      {row.symbol ? (
                        <Link href={`/stocks/${row.symbol}`} className="text-link hover:underline">
                          {row.symbol}
                        </Link>
                      ) : (
                        "—"
                      )}
                    </td>
                  ) : null}
                  <td className="max-w-[220px] truncate">
                    {row.link ? (
                      <a href={row.link} className="text-link hover:underline" target="_blank" rel="noreferrer">
                        {name}
                      </a>
                    ) : (
                      name
                    )}
                    {row.owner && row.owner !== "Self" ? (
                      <div className="text-xs text-muted">{row.owner}</div>
                    ) : null}
                  </td>
                  <td className="text-muted">
                    {row.chamber}
                    {row.district ? ` · ${row.district}` : ""}
                  </td>
                  <td
                    className={cn(
                      "font-medium",
                      side === "Buy" ? "text-gain" : side === "Sell" ? "text-loss" : "text-muted",
                    )}
                  >
                    {row.type || side}
                  </td>
                  <td className="whitespace-nowrap">{row.amount || "—"}</td>
                  <td className="max-w-[240px] truncate text-muted">{row.assetDescription || row.assetType || "—"}</td>
                  <td>{formatDate(row.disclosureDate)}</td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
