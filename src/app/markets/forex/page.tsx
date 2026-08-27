import { Container } from "@/components/container";
import { PageHeader } from "@/components/page-header";
import { SectionNav } from "@/components/section-nav";
import { ChangePercent } from "@/components/change";
import { NewsList } from "@/components/news-list";
import { MARKET_NAV } from "@/lib/nav";
import { formatPrice } from "@/lib/format";
import { getForexList, getForexNewsLatest, getForexQuotes } from "@/lib/fmp";
import { FOREX_CURRENCIES, quoteHref } from "@/lib/listings";
import { percentFromPriceChange } from "@/lib/utils";
import Link from "next/link";

export const metadata = {
  title: "Forex Rates",
  description: "Live major currency pairs from FMP forex quotes.",
};

const PINNED = [
  "EURUSD",
  "GBPUSD",
  "USDJPY",
  "USDCHF",
  "AUDUSD",
  "USDCAD",
  "NZDUSD",
  "EURGBP",
  "EURJPY",
  "GBPJPY",
  "USDCNY",
];

export default async function ForexPage() {
  const [pairs, quotes, news] = await Promise.all([getForexList(), getForexQuotes(), getForexNewsLatest(12)]);
  const bySymbol = new Map(quotes.map((row) => [row.symbol, row]));
  const pinRank = new Map(PINNED.map((symbol, index) => [symbol, index]));
  const rows = pairs
    .filter(
      (row) =>
        FOREX_CURRENCIES.has(row.fromCurrency) &&
        FOREX_CURRENCIES.has(row.toCurrency) &&
        row.fromCurrency !== row.toCurrency,
    )
    .map((row) => {
      const quote = bySymbol.get(row.symbol);
      const price = quote?.price ?? null;
      const change = quote?.change ?? null;
      return {
        symbol: row.symbol,
        pair: `${row.fromCurrency}/${row.toCurrency}`,
        name: `${row.fromName} / ${row.toName}`,
        price,
        change,
        changePercentage: percentFromPriceChange(price, change),
        volume: quote?.volume ?? 0,
        pinned: pinRank.get(row.symbol) ?? 1000,
      };
    })
    .filter((row) => row.price != null && row.price > 0)
    .sort((a, b) => a.pinned - b.pinned || (b.volume ?? 0) - (a.volume ?? 0) || a.pair.localeCompare(b.pair))
    .slice(0, 60);

  return (
    <Container>
      <PageHeader
        title="Forex"
        description="Major currency pairs with live mid-market rates from FMP batch forex quotes."
      />
      <SectionNav items={MARKET_NAV} />
      <p className="mb-3 text-sm text-muted">{rows.length} major pairs</p>
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="sa-table">
          <thead>
            <tr>
              <th>Pair</th>
              <th>Currencies</th>
              <th className="num">Rate</th>
              <th className="num">Change</th>
              <th className="num">% Change</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-muted">
                  No forex quotes available.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.symbol}>
                  <td className="symbol font-semibold">
                    <Link href={quoteHref(row.symbol, { exchange: "FOREX" })} className="text-link hover:underline">
                      {row.pair}
                    </Link>
                  </td>
                  <td className="max-w-[320px] truncate text-muted">{row.name}</td>
                  <td className="num">{formatPrice(row.price, 4)}</td>
                  <td className="num">{row.change == null ? "—" : formatPrice(row.change, 4)}</td>
                  <td className="num">
                    <ChangePercent value={row.changePercentage} alreadyPercent={false} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {news.length > 0 ? (
        <section className="mt-10">
          <div className="mb-3 flex items-end justify-between">
            <h2 className="text-xl font-semibold text-header">Forex News</h2>
            <Link href="/news/forex" className="text-sm text-link hover:underline">
              All forex news
            </Link>
          </div>
          <NewsList items={news} />
        </section>
      ) : null}
    </Container>
  );
}
