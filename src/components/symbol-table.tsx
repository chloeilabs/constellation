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
  revenue?: number | null;
  employees?: number | null;
  incomeTax?: number | null;
  netIncome?: number | null;
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
  showRevenue = false,
  showEmployees = false,
  showTax = false,
  showProfit = false,
}: {
  rows: SymbolTableRow[];
  hrefBase?: string;
  empty?: string;
  showIndustry?: boolean;
  showYield?: boolean;
  showFounded?: boolean;
  showCountry?: boolean;
  localCurrency?: boolean;
  showRevenue?: boolean;
  showEmployees?: boolean;
  showTax?: boolean;
  showProfit?: boolean;
}) {
  const colSpan =
    6 +
    (showIndustry ? 1 : 0) +
    (showYield ? 1 : 0) +
    (showFounded ? 1 : 0) +
    (showCountry ? 1 : 0) +
    (showRevenue ? 1 : 0) +
    (showEmployees ? 1 : 0) +
    (showTax ? 1 : 0) +
    (showProfit ? 1 : 0);
  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="sa-table">
        <thead>
          <tr>
            <th>Symbol</th>
            <th>Company Name</th>
            {showFounded ? <th className="num">Founded</th> : null}
            <th className="num">Market Cap</th>
            {showRevenue ? <th className="num">Revenue (ttm)</th> : null}
            {showProfit ? <th className="num">Net Income (ttm)</th> : null}
            {showEmployees ? <th className="num">Employees</th> : null}
            {showTax ? <th className="num">Income Tax (ttm)</th> : null}
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
                {showRevenue ? <td className="num">{formatCompactUsd(row.revenue)}</td> : null}
                {showProfit ? <td className="num">{formatCompactUsd(row.netIncome)}</td> : null}
                {showEmployees ? <td className="num">{formatInteger(row.employees)}</td> : null}
                {showTax ? <td className="num">{formatCompactUsd(row.incomeTax)}</td> : null}
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
