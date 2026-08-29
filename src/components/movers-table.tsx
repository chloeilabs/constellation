import Link from "next/link";
import { ChangePercent } from "@/components/change";
import { formatPrice } from "@/lib/format";
import { quoteHref } from "@/lib/listings";
import type { FmpMover } from "@/lib/types";

export function MoversTable({
  title,
  href,
  rows,
}: {
  title: string;
  href: string;
  rows: FmpMover[];
}) {
  return (
    <section>
      <div className="mb-3 flex items-end justify-between">
        <h2 className="text-xl font-semibold text-header">{title}</h2>
        <Link href={href} className="text-sm text-link hover:underline">
          See all
        </Link>
      </div>
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="sa-table">
          <thead>
            <tr>
              <th>Symbol</th>
              <th>Name</th>
              <th className="num">Price</th>
              <th className="num">Change</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={4} className="text-muted">
                  No data available.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.symbol}>
                  <td className="symbol">
                    <Link href={quoteHref(row.symbol, { name: row.name, exchange: row.exchange })} className="text-link hover:underline">
                      {row.symbol}
                    </Link>
                  </td>
                  <td className="max-w-[220px] truncate text-muted">{row.name}</td>
                  <td className="num">{formatPrice(row.price)}</td>
                  <td className="num">
                    <ChangePercent value={row.changesPercentage} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
