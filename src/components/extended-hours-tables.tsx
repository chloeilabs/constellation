import Link from "next/link";
import { ChangePercent, ChangeValue } from "@/components/change";
import { formatInteger, formatPrice } from "@/lib/format";
import { quoteHref } from "@/lib/listings";
import type { ExtendedHoursRow } from "@/lib/extended-hours";

function Table({
  title,
  rows,
}: {
  title: string;
  rows: ExtendedHoursRow[];
}) {
  return (
    <section>
      <h2 className="mb-3 text-xl font-semibold text-header">{title}</h2>
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="sa-table">
          <thead>
            <tr>
              <th>Symbol</th>
              <th>Name</th>
              <th className="num">Last</th>
              <th className="num">Extended</th>
              <th className="num">Change</th>
              <th className="num">% Change</th>
              <th className="num">Volume</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-muted">
                  No extended-hours prints available.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.symbol}>
                  <td className="symbol">
                    <Link href={quoteHref(row.symbol, { name: row.name })} className="text-link hover:underline">
                      {row.symbol}
                    </Link>
                  </td>
                  <td className="max-w-[240px] truncate text-muted">{row.name}</td>
                  <td className="num">{formatPrice(row.last)}</td>
                  <td className="num">{formatPrice(row.extended)}</td>
                  <td className="num">
                    <ChangeValue change={row.change} />
                  </td>
                  <td className="num">
                    <ChangePercent value={row.changePct} alreadyPercent />
                  </td>
                  <td className="num">{formatInteger(row.volume)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function ExtendedHoursTables({ rows }: { rows: ExtendedHoursRow[] }) {
  const withMove = rows.filter((row) => row.changePct != null && Number.isFinite(row.changePct));
  const gainers = [...withMove].filter((row) => (row.changePct ?? 0) > 0).sort((a, b) => (b.changePct ?? 0) - (a.changePct ?? 0));
  const losers = [...withMove].filter((row) => (row.changePct ?? 0) < 0).sort((a, b) => (a.changePct ?? 0) - (b.changePct ?? 0));
  const active = [...rows].sort((a, b) => (b.volume ?? 0) - (a.volume ?? 0));

  return (
    <div className="grid gap-8 lg:grid-cols-1">
      <Table title="Top Gainers" rows={gainers.slice(0, 25)} />
      <Table title="Top Losers" rows={losers.slice(0, 25)} />
      <Table title="Most Active" rows={active.slice(0, 25)} />
    </div>
  );
}
