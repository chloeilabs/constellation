import Link from "next/link";
import { formatDate } from "@/lib/format";
import { quoteHref } from "@/lib/listings";
import { cn } from "@/lib/utils";
import { congressSide, politicianHref, politicianName, type CongressTradeRow } from "@/lib/congress";

export function CongressTable({
  rows,
  showSymbol = true,
  showPolitician = true,
  empty = "No congressional trades in this window.",
}: {
  rows: CongressTradeRow[];
  showSymbol?: boolean;
  showPolitician?: boolean;
  empty?: string;
}) {
  const colSpan = 6 + Number(showSymbol) + Number(showPolitician);
  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="sa-table">
        <thead>
          <tr>
            <th>Trade Date</th>
            {showSymbol ? <th>Symbol</th> : null}
            {showPolitician ? <th>Politician</th> : null}
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
                        <Link href={quoteHref(row.symbol)} className="text-link hover:underline">
                          {row.symbol}
                        </Link>
                      ) : (
                        "—"
                      )}
                    </td>
                  ) : null}
                  {showPolitician ? (
                    <td className="max-w-[220px] truncate">
                      <Link href={politicianHref(row)} className="text-link hover:underline">
                        {name}
                      </Link>
                      {row.owner && row.owner !== "Self" ? (
                        <div className="text-xs text-muted">{row.owner}</div>
                      ) : null}
                    </td>
                  ) : null}
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
                  <td>
                    {row.link ? (
                      <a href={row.link} className="text-link hover:underline" target="_blank" rel="noreferrer">
                        {formatDate(row.disclosureDate)}
                      </a>
                    ) : (
                      formatDate(row.disclosureDate)
                    )}
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
