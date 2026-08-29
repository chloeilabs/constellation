import Link from "next/link";
import { ChangePercent } from "@/components/change";
import { formatPrice } from "@/lib/format";
import { quoteHref } from "@/lib/listings";

export type MarketQuoteRow = {
  symbol: string;
  name: string;
  price: number | null;
  changePercentage: number | null;
  extra?: string | null;
};

export function MarketQuotesTable({
  title,
  href,
  rows,
  empty = "No quotes available.",
  priceDigits,
  linkSymbols = false,
  alreadyPercent = true,
  extraLabel,
}: {
  title: string;
  href?: string;
  rows: MarketQuoteRow[];
  empty?: string;
  priceDigits?: number;
  linkSymbols?: boolean;
  alreadyPercent?: boolean;
  extraLabel?: string;
}) {
  return (
    <section>
      <div className="mb-3 flex items-end justify-between gap-3">
        <h2 className="text-xl font-semibold text-header">{title}</h2>
        {href ? (
          <Link href={href} className="text-sm text-link hover:underline">
            Full table
          </Link>
        ) : null}
      </div>
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="sa-table">
          <thead>
            <tr>
              <th>Symbol</th>
              <th>Name</th>
              {extraLabel ? <th>{extraLabel}</th> : null}
              <th className="num">Price</th>
              <th className="num">% Change</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={extraLabel ? 5 : 4} className="text-muted">
                  {empty}
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.symbol}>
                  <td className="symbol font-semibold">
                    {linkSymbols ? (
                      <Link
                        href={quoteHref(row.symbol)}
                        className="text-link hover:underline"
                      >
                        {row.symbol}
                      </Link>
                    ) : (
                      row.symbol
                    )}
                  </td>
                  <td className="max-w-[240px] truncate">{row.name}</td>
                  {extraLabel ? <td className="text-muted">{row.extra || "—"}</td> : null}
                  <td className="num">{formatPrice(row.price, priceDigits)}</td>
                  <td className="num">
                    <ChangePercent value={row.changePercentage} alreadyPercent={alreadyPercent} />
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
