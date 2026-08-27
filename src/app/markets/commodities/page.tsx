import { Container } from "@/components/container";
import { PageHeader } from "@/components/page-header";
import { SectionNav } from "@/components/section-nav";
import { ChangePercent } from "@/components/change";
import { MARKET_NAV } from "@/lib/nav";
import { formatInteger, formatPrice } from "@/lib/format";
import { getCommoditiesList, getCommodityQuotes } from "@/lib/fmp";
import { percentFromPriceChange } from "@/lib/utils";

const PINNED = ["GCUSD", "SIUSD", "CLUSD", "BZUSD", "NGUSD", "HGUSD", "ZCUSD", "ZWUSD", "ZSUSD", "KCUSD", "CTUSD", "SBUSD"];

export const metadata = {
  title: "Commodities",
  description: "Live futures prices for gold, crude oil, natural gas, grains, and other commodities.",
};

export default async function CommoditiesPage() {
  const [names, quotes] = await Promise.all([getCommoditiesList(), getCommodityQuotes()]);
  const bySymbol = new Map(quotes.map((row) => [row.symbol, row]));
  const pinRank = new Map(PINNED.map((symbol, index) => [symbol, index]));
  const rows = names
    .map((row) => {
      const quote = bySymbol.get(row.symbol);
      const price = quote?.price ?? null;
      const change = quote?.change ?? null;
      const changePercentage = percentFromPriceChange(price, change);
      return {
        symbol: row.symbol,
        name: row.name,
        currency: row.currency,
        tradeMonth: row.tradeMonth,
        price,
        change,
        changePercentage,
        volume: quote?.volume ?? null,
        pinned: pinRank.get(row.symbol) ?? 1000,
      };
    })
    .sort((a, b) => a.pinned - b.pinned || (b.volume ?? 0) - (a.volume ?? 0));

  return (
    <Container>
      <PageHeader
        title="Commodities & Futures"
        description="Gold, oil, natural gas, grains, and other futures contracts from FMP commodity quotes."
      />
      <SectionNav items={MARKET_NAV} />
      <p className="mb-3 text-sm text-muted">{rows.length} contracts, with gold, oil, and grains listed first</p>
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="sa-table">
          <thead>
            <tr>
              <th>Contract</th>
              <th>Name</th>
              <th className="num">Price</th>
              <th className="num">Change</th>
              <th className="num">% Change</th>
              <th className="num">Volume</th>
              <th>Month</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-muted">
                  No commodity quotes available.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.symbol}>
                  <td className="symbol font-semibold">{row.symbol}</td>
                  <td className="max-w-[280px] truncate">{row.name}</td>
                  <td className="num">{formatPrice(row.price)}</td>
                  <td className="num">{row.change == null ? "—" : formatPrice(row.change)}</td>
                  <td className="num">
                    <ChangePercent value={row.changePercentage} alreadyPercent={false} />
                  </td>
                  <td className="num">{formatInteger(row.volume)}</td>
                  <td className="text-muted">{row.tradeMonth || "—"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </Container>
  );
}
