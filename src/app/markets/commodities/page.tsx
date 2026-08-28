import { Container } from "@/components/container";
import { PageHeader } from "@/components/page-header";
import { SectionNav } from "@/components/section-nav";
import { ChangePercent } from "@/components/change";
import { MARKET_NAV } from "@/lib/nav";
import { formatDate, formatInteger, formatPercentPlain, formatPrice } from "@/lib/format";
import { getCommoditiesList, getCommodityQuotes, getCotAnalysis } from "@/lib/fmp";
import { quoteHref } from "@/lib/listings";
import { commodityContractRoot, latestCotBySymbol } from "@/lib/markets";
import { addDays, cn, isoDate, nyDateString, percentFromPriceChange } from "@/lib/utils";
import Link from "next/link";

const PINNED = [
  "GCUSD",
  "SIUSD",
  "CLUSD",
  "BZUSD",
  "NGUSD",
  "HGUSD",
  "ZCUSX",
  "ZSUSX",
  "KEUSX",
  "KCUSX",
  "CTUSX",
  "SBUSX",
];

export const metadata = {
  title: "Commodities",
  description: "Live futures prices for gold, crude oil, natural gas, grains, and other commodities.",
};

export default async function CommoditiesPage() {
  const today = nyDateString();
  const cotFrom = isoDate(addDays(new Date(`${today}T00:00:00Z`), -21));
  const [names, quotes, cotRows] = await Promise.all([
    getCommoditiesList(),
    getCommodityQuotes(),
    getCotAnalysis(cotFrom, today),
  ]);
  const bySymbol = new Map(quotes.map((row) => [row.symbol, row]));
  const pinRank = new Map(PINNED.map((symbol, index) => [symbol, index]));
  const cotByRoot = latestCotBySymbol(cotRows);
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
        cot: cotByRoot.get(commodityContractRoot(row.symbol)) ?? null,
      };
    })
    .sort((a, b) => a.pinned - b.pinned || (b.volume ?? 0) - (a.volume ?? 0));
  const cotTable = rows.flatMap((row) => (row.cot ? [{ ...row, cot: row.cot }] : []));
  const cotAsOf = cotTable[0]?.cot?.date;

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
                  <td className="symbol font-semibold">
                    <Link href={quoteHref(row.symbol, { exchange: "COMMODITY" })} className="text-link hover:underline">
                      {row.symbol}
                    </Link>
                  </td>
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
      {cotTable.length > 0 ? (
        <section className="mt-10">
          <h2 className="mb-3 text-lg font-semibold text-header">Commitment of Traders</h2>
          <p className="mb-3 text-sm text-muted">
            Latest CFTC positioning from FMP for contracts that match this quote list
            {cotAsOf ? ` · week of ${formatDate(cotAsOf)}` : ""}. Net position is non-commercial longs minus shorts.
          </p>
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="sa-table">
              <thead>
                <tr>
                  <th>Contract</th>
                  <th>Name</th>
                  <th>Situation</th>
                  <th>Sentiment</th>
                  <th className="num">Net Position</th>
                  <th className="num">Net Chg</th>
                  <th className="num">Long %</th>
                  <th className="num">Short %</th>
                </tr>
              </thead>
              <tbody>
                {cotTable.map((row) => {
                  const { cot } = row;
                  const bullish = /bullish/i.test(cot.marketSituation || "");
                  const bearish = /bearish/i.test(cot.marketSituation || "");
                  return (
                    <tr key={`${row.symbol}-cot`}>
                      <td className="symbol font-semibold">
                        <Link
                          href={quoteHref(row.symbol, { exchange: "COMMODITY" })}
                          className="text-link hover:underline"
                        >
                          {row.symbol}
                        </Link>
                      </td>
                      <td className="max-w-[280px] truncate">{cot.name || row.name}</td>
                      <td
                        className={cn(
                          "font-medium",
                          bullish && "text-gain",
                          bearish && "text-loss",
                        )}
                      >
                        {cot.marketSituation || "—"}
                      </td>
                      <td className="text-muted">{cot.marketSentiment || "—"}</td>
                      <td className="num">{formatInteger(cot.netPostion)}</td>
                      <td className="num">
                        <ChangePercent value={cot.changeInNetPosition} alreadyPercent />
                      </td>
                      <td className="num">
                        {formatPercentPlain(cot.currentLongMarketSituation, { alreadyPercent: true })}
                      </td>
                      <td className="num">
                        {formatPercentPlain(cot.currentShortMarketSituation, { alreadyPercent: true })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}
    </Container>
  );
}
