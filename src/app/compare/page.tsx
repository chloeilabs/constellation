import Link from "next/link";
import { Container } from "@/components/container";
import { PageHeader } from "@/components/page-header";
import { ChangePercent } from "@/components/change";
import { formatCompactUsd, formatPercentPlain, formatPrice, formatRatio } from "@/lib/format";
import { getProfilesAndQuotes } from "@/lib/compare";
import { industrySlug } from "@/lib/industries";
import { quoteHref } from "@/lib/listings";

export default async function ComparePage({
  searchParams,
}: {
  searchParams: Promise<{ symbols?: string }>;
}) {
  const { symbols: raw } = await searchParams;
  const symbols = (raw ?? "AAPL,MSFT,GOOGL")
    .split(",")
    .map((symbol) => symbol.trim().toUpperCase())
    .filter(Boolean)
    .slice(0, 4);
  const rows = await getProfilesAndQuotes(symbols);

  return (
    <Container>
      <PageHeader
        title="Compare Stocks"
        description="Side-by-side quotes, valuation, and trailing financials."
        actions={
          <form className="flex gap-2">
            <input
              name="symbols"
              defaultValue={symbols.join(",")}
              placeholder="AAPL,MSFT,NVDA"
              className="h-9 w-56 rounded-md border border-border px-2 text-sm"
            />
            <button className="h-9 rounded-md bg-header px-3 text-sm font-medium text-white" type="submit">
              Compare
            </button>
          </form>
        }
      />
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="sa-table">
          <thead>
            <tr>
              <th>Metric</th>
              {rows.map((row) => (
                <th key={row.symbol} className="num">
                  <Link
                    href={quoteHref(row.symbol, { name: row.quote?.name ?? row.profile?.companyName, isEtf: row.profile?.isEtf })}
                    className="text-link hover:underline"
                  >
                    {row.symbol}
                  </Link>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Name</td>
              {rows.map((row) => (
                <td key={row.symbol} className="num">
                  {row.profile?.companyName ?? row.quote?.name ?? "—"}
                </td>
              ))}
            </tr>
            <tr>
              <td>Price</td>
              {rows.map((row) => (
                <td key={row.symbol} className="num">
                  {formatPrice(row.quote?.price)}
                </td>
              ))}
            </tr>
            <tr>
              <td>Change</td>
              {rows.map((row) => (
                <td key={row.symbol} className="num">
                  <ChangePercent value={row.quote?.changePercentage} />
                </td>
              ))}
            </tr>
            <tr>
              <td>Market Cap</td>
              {rows.map((row) => (
                <td key={row.symbol} className="num">
                  {formatCompactUsd(row.quote?.marketCap ?? row.profile?.marketCap)}
                </td>
              ))}
            </tr>
            <tr>
              <td>Revenue (ttm)</td>
              {rows.map((row) => (
                <td key={row.symbol} className="num">
                  {formatCompactUsd(row.ttm?.revenue)}
                </td>
              ))}
            </tr>
            <tr>
              <td>Net Income (ttm)</td>
              {rows.map((row) => (
                <td key={row.symbol} className="num">
                  {formatCompactUsd(row.ttm?.netIncome)}
                </td>
              ))}
            </tr>
            <tr>
              <td>Free Cash Flow (ttm)</td>
              {rows.map((row) => (
                <td key={row.symbol} className="num">
                  {formatCompactUsd(row.cash?.freeCashFlow)}
                </td>
              ))}
            </tr>
            <tr>
              <td>EPS (ttm)</td>
              {rows.map((row) => (
                <td key={row.symbol} className="num">
                  {row.ttm?.epsDiluted != null || row.ttm?.eps != null
                    ? `$${formatPrice(row.ttm.epsDiluted ?? row.ttm.eps)}`
                    : "—"}
                </td>
              ))}
            </tr>
            <tr>
              <td>PE Ratio</td>
              {rows.map((row) => (
                <td key={row.symbol} className="num">
                  {formatRatio(row.ratios?.priceToEarningsRatioTTM)}
                </td>
              ))}
            </tr>
            <tr>
              <td>PS Ratio</td>
              {rows.map((row) => (
                <td key={row.symbol} className="num">
                  {formatRatio(row.ratios?.priceToSalesRatioTTM)}
                </td>
              ))}
            </tr>
            <tr>
              <td>PB Ratio</td>
              {rows.map((row) => (
                <td key={row.symbol} className="num">
                  {formatRatio(row.ratios?.priceToBookRatioTTM)}
                </td>
              ))}
            </tr>
            <tr>
              <td>ROE</td>
              {rows.map((row) => (
                <td key={row.symbol} className="num">
                  {formatPercentPlain(
                    typeof row.metrics?.returnOnEquityTTM === "number" ? row.metrics.returnOnEquityTTM : null,
                  )}
                </td>
              ))}
            </tr>
            <tr>
              <td>Dividend Yield</td>
              {rows.map((row) => (
                <td key={row.symbol} className="num">
                  {formatPercentPlain(
                    typeof row.ratios?.dividendYieldTTM === "number" ? row.ratios.dividendYieldTTM : null,
                  )}
                </td>
              ))}
            </tr>
            <tr>
              <td>Profit Margin</td>
              {rows.map((row) => (
                <td key={row.symbol} className="num">
                  {formatPercentPlain(
                    typeof row.ratios?.netProfitMarginTTM === "number" ? row.ratios.netProfitMarginTTM : null,
                  )}
                </td>
              ))}
            </tr>
            <tr>
              <td>Sector</td>
              {rows.map((row) => (
                <td key={row.symbol} className="num">
                  {row.profile?.sector ?? "—"}
                </td>
              ))}
            </tr>
            <tr>
              <td>Industry</td>
              {rows.map((row) => (
                <td key={row.symbol} className="num">
                  {row.profile?.industry ? (
                    <Link href={`/stocks/industry/${industrySlug(row.profile.industry)}`} className="text-link hover:underline">
                      {row.profile.industry}
                    </Link>
                  ) : (
                    "—"
                  )}
                </td>
              ))}
            </tr>
            <tr>
              <td>Beta</td>
              {rows.map((row) => (
                <td key={row.symbol} className="num">
                  {formatRatio(row.profile?.beta)}
                </td>
              ))}
            </tr>
            <tr>
              <td>52-Week Range</td>
              {rows.map((row) => (
                <td key={row.symbol} className="num">
                  {row.quote ? `${formatPrice(row.quote.yearLow)} - ${formatPrice(row.quote.yearHigh)}` : "—"}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </Container>
  );
}
