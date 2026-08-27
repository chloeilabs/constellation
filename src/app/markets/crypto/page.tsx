import { Container } from "@/components/container";
import { PageHeader } from "@/components/page-header";
import { SectionNav } from "@/components/section-nav";
import { ChangePercent } from "@/components/change";
import { MARKET_NAV } from "@/lib/nav";
import { formatCompact, formatInteger, formatPrice } from "@/lib/format";
import { getCryptocurrencyList, getCryptoQuotes } from "@/lib/fmp";
import { percentFromPriceChange } from "@/lib/utils";

export const metadata = {
  title: "Cryptocurrency Prices",
  description: "Live USD cryptocurrency prices, ranked by trading volume from FMP.",
};

export default async function CryptoPage() {
  const [names, quotes] = await Promise.all([getCryptocurrencyList(), getCryptoQuotes()]);
  const bySymbol = new Map(quotes.map((row) => [row.symbol, row]));
  const rows = names
    .filter((row) => row.symbol.endsWith("USD") && !row.symbol.endsWith("USDT"))
    .map((row) => {
      const quote = bySymbol.get(row.symbol);
      const price = quote?.price ?? null;
      const change = quote?.change ?? null;
      return {
        symbol: row.symbol,
        name: row.name.replace(/\s+USD$/i, ""),
        price,
        change,
        changePercentage: percentFromPriceChange(price, change),
        volume: quote?.volume ?? null,
        circulatingSupply: row.circulatingSupply ?? null,
      };
    })
    .filter((row) => (row.volume ?? 0) > 0 && (row.price ?? 0) > 0)
    .sort((a, b) => (b.volume ?? 0) - (a.volume ?? 0))
    .slice(0, 80);

  return (
    <Container>
      <PageHeader
        title="Cryptocurrency"
        description="Major USD crypto pairs ranked by reported volume from FMP batch quotes."
      />
      <SectionNav items={MARKET_NAV} />
      <p className="mb-3 text-sm text-muted">{rows.length} USD pairs, ranked by volume</p>
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="sa-table">
          <thead>
            <tr>
              <th>Symbol</th>
              <th>Name</th>
              <th className="num">Price</th>
              <th className="num">Change</th>
              <th className="num">% Change</th>
              <th className="num">Volume</th>
              <th className="num">Circulating</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-muted">
                  No cryptocurrency quotes available.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.symbol}>
                  <td className="symbol font-semibold">{row.symbol}</td>
                  <td className="max-w-[240px] truncate">{row.name}</td>
                  <td className="num">{formatPrice(row.price)}</td>
                  <td className="num">{row.change == null ? "—" : formatPrice(row.change)}</td>
                  <td className="num">
                    <ChangePercent value={row.changePercentage} alreadyPercent={false} />
                  </td>
                  <td className="num">{formatInteger(row.volume)}</td>
                  <td className="num">{formatCompact(row.circulatingSupply)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </Container>
  );
}
