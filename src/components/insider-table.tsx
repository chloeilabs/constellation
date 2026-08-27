import Link from "next/link";
import { formatCompactUsd, formatDate, formatInteger, formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { FmpInsiderTrade } from "@/lib/types";

function sideLabel(row: FmpInsiderTrade) {
  if (row.acquisitionOrDisposition === "A") return "Buy";
  if (row.acquisitionOrDisposition === "D") return "Sell";
  return row.transactionType || "—";
}

export function InsiderTable({
  rows,
  showSymbol = true,
  empty = "No insider trades in this window.",
}: {
  rows: FmpInsiderTrade[];
  showSymbol?: boolean;
  empty?: string;
}) {
  const colSpan = showSymbol ? 8 : 7;
  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="sa-table">
        <thead>
          <tr>
            <th>Date</th>
            {showSymbol ? <th>Symbol</th> : null}
            <th>Insider</th>
            <th>Role</th>
            <th>Type</th>
            <th className="num">Shares</th>
            <th className="num">Price</th>
            <th className="num">Value</th>
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
              const value =
                typeof row.securitiesTransacted === "number" && typeof row.price === "number"
                  ? row.securitiesTransacted * row.price
                  : null;
              const side = sideLabel(row);
              return (
                <tr key={`${row.symbol}-${row.filingDate}-${row.reportingCik}-${index}`}>
                  <td>{formatDate(row.transactionDate || row.filingDate)}</td>
                  {showSymbol ? (
                    <td className="symbol">
                      <Link href={`/stocks/${row.symbol}`} className="text-link hover:underline">
                        {row.symbol}
                      </Link>
                    </td>
                  ) : null}
                  <td className="max-w-[220px] truncate">
                    {row.url ? (
                      <a href={row.url} className="text-link hover:underline" target="_blank" rel="noreferrer">
                        {row.reportingName}
                      </a>
                    ) : (
                      row.reportingName
                    )}
                  </td>
                  <td className="max-w-[180px] truncate text-muted">{row.typeOfOwner || "—"}</td>
                  <td
                    className={cn(
                      "font-medium",
                      side === "Buy" ? "text-gain" : side === "Sell" ? "text-loss" : "text-muted",
                    )}
                  >
                    {side}
                  </td>
                  <td className="num">{formatInteger(row.securitiesTransacted)}</td>
                  <td className="num">{row.price ? formatPrice(row.price) : "—"}</td>
                  <td className="num">{value && value > 0 ? formatCompactUsd(value) : "—"}</td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
