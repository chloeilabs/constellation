import Link from "next/link";
import { ChangePercent } from "@/components/change";
import { currencyForCountry, formatCompactMoney, formatCompactUsd, formatInteger, formatPercentPlain, formatPrice } from "@/lib/format";
import { industrySlug } from "@/lib/industries";
import { quoteHref } from "@/lib/listings";

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
  dividendYield?: number | null;
  founded?: number | null;
  country?: string | null;
  isEtf?: boolean | null;
  isFund?: boolean | null;
};

export function SymbolTable({
  rows,
  hrefBase = "/stocks",
  empty = "No results found.",
  showIndustry = true,
  showYield = false,
  showFounded = false,
  showCountry = false,
  localCurrency = false,
}: {
  rows: SymbolTableRow[];
  hrefBase?: string;
  empty?: string;
  showIndustry?: boolean;
  showYield?: boolean;
  showFounded?: boolean;
  showCountry?: boolean;
  localCurrency?: boolean;
}) {
  const colSpan = 6 + (showIndustry ? 1 : 0) + (showYield ? 1 : 0) + (showFounded ? 1 : 0) + (showCountry ? 1 : 0);
  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="sa-table">
        <thead>
          <tr>
            <th>Symbol</th>
            <th>Company Name</th>
            {showFounded ? <th className="num">Founded</th> : null}
            <th className="num">Market Cap</th>
            <th className="num">Stock Price</th>
            <th className="num">% Change</th>
            {showYield ? <th className="num">Yield</th> : null}
            {showCountry ? <th>Country</th> : null}
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
                  <Link
                    href={quoteHref(row.symbol, {
                      name: row.name,
                      isEtf: row.isEtf ?? hrefBase === "/etf",
                      isFund: row.isFund ?? hrefBase === "/funds",
                    })}
                    className="text-link hover:underline"
                  >
                    {row.symbol}
                  </Link>
                </td>
                <td className="max-w-[280px] truncate">{row.name}</td>
                {showFounded ? <td className="num">{row.founded ?? "—"}</td> : null}
                <td className="num">
                  {localCurrency
                    ? formatCompactMoney(row.marketCap, currencyForCountry(row.country))
                    : formatCompactUsd(row.marketCap)}
                </td>
                <td className="num">{formatPrice(row.price)}</td>
                <td className="num">
                  <ChangePercent value={row.changePercentage} />
                </td>
                {showYield ? <td className="num">{formatPercentPlain(row.dividendYield)}</td> : null}
                {showCountry ? <td className="text-muted">{row.country || "—"}</td> : null}
                {showIndustry ? (
                  <td className="text-muted">
                    {row.industry ? (
                      <Link href={`/stocks/industry/${industrySlug(row.industry)}`} className="hover:text-link hover:underline">
                        {row.industry}
                      </Link>
                    ) : (
                      row.exchange || "—"
                    )}
                  </td>
                ) : null}
                <td className="num">{formatInteger(row.volume)}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
