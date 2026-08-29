import Link from "next/link";
import { ChangePercent, ChangeValue } from "@/components/change";
import { formatInteger, formatPrice } from "@/lib/format";
import { quoteHref } from "@/lib/listings";
import { splitExtendedHours, type ExtendedHoursRow } from "@/lib/extended-hours";

function Table({
  title,
  href,
  rows,
}: {
  title: string;
  href?: string;
  rows: ExtendedHoursRow[];
}) {
  return (
    <section>
      <div className="mb-3 flex items-end justify-between gap-3">
        <h2 className="text-xl font-semibold text-header">{title}</h2>
        {href ? (
          <Link href={href} className="text-sm text-link hover:underline">
            See all
          </Link>
        ) : null}
      </div>
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

export function ExtendedHoursTables({
  rows,
  limit = 25,
  showActive = true,
  gainerHref,
  loserHref,
  activeHref,
  gainerTitle = "Top Gainers",
  loserTitle = "Top Losers",
  activeTitle = "Most Active",
}: {
  rows: ExtendedHoursRow[];
  limit?: number;
  showActive?: boolean;
  gainerHref?: string;
  loserHref?: string;
  activeHref?: string;
  gainerTitle?: string;
  loserTitle?: string;
  activeTitle?: string;
}) {
  const { gainers, losers, active } = splitExtendedHours(rows);

  return (
    <div className={showActive ? "grid gap-8" : "grid gap-8 lg:grid-cols-2"}>
      <Table title={gainerTitle} href={gainerHref} rows={gainers.slice(0, limit)} />
      <Table title={loserTitle} href={loserHref} rows={losers.slice(0, limit)} />
      {showActive ? <Table title={activeTitle} href={activeHref} rows={active.slice(0, limit)} /> : null}
    </div>
  );
}

export function ExtendedHoursKindTable({
  rows,
  kind,
  limit = 50,
}: {
  rows: ExtendedHoursRow[];
  kind: "gainers" | "losers" | "active";
  limit?: number;
}) {
  const split = splitExtendedHours(rows);
  const title = kind === "gainers" ? "Top Gainers" : kind === "losers" ? "Top Losers" : "Most Active";
  return <Table title={title} rows={split[kind].slice(0, limit)} />;
}
