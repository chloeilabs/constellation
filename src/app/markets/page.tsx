import Link from "next/link";
import { Container } from "@/components/container";
import { MarketQuotesTable } from "@/components/market-quotes-table";
import { MoversTable } from "@/components/movers-table";
import { ExtendedHoursTables } from "@/components/extended-hours-tables";
import { PageHeader } from "@/components/page-header";
import { ChangePercent } from "@/components/change";
import { SectionNav } from "@/components/section-nav";
import { MARKET_NAV } from "@/lib/nav";
import {
  getCommodityQuotes,
  getCryptoQuotes,
  getForexQuotes,
  getGainers,
  getIndexQuotes,
  getLosers,
  getMostActive,
  getSectorPerformance,
  getWorldIndexQuotes,
  INDEX_SYMBOLS,
  WORLD_INDEX_SYMBOLS,
} from "@/lib/fmp";
import { getExtendedHoursRows } from "@/lib/extended-hours";
import { INDEX_LABELS } from "@/lib/statements";
import { addDays, isoDate, nyDateString, nyExtendedCopy, nySession, percentFromPriceChange } from "@/lib/utils";

const COMMODITY_SNIPPET = [
  { symbol: "GCUSD", name: "Gold" },
  { symbol: "SIUSD", name: "Silver" },
  { symbol: "CLUSD", name: "WTI Crude" },
  { symbol: "BZUSD", name: "Brent Crude" },
  { symbol: "NGUSD", name: "Natural Gas" },
  { symbol: "HGUSD", name: "Copper" },
] as const;

const CRYPTO_SNIPPET = [
  { symbol: "BTCUSD", name: "Bitcoin" },
  { symbol: "ETHUSD", name: "Ethereum" },
  { symbol: "SOLUSD", name: "Solana" },
  { symbol: "XRPUSD", name: "XRP" },
  { symbol: "ADAUSD", name: "Cardano" },
  { symbol: "DOGEUSD", name: "Dogecoin" },
] as const;

const FOREX_SNIPPET = [
  { symbol: "EURUSD", name: "EUR/USD" },
  { symbol: "GBPUSD", name: "GBP/USD" },
  { symbol: "USDJPY", name: "USD/JPY" },
  { symbol: "USDCHF", name: "USD/CHF" },
  { symbol: "AUDUSD", name: "AUD/USD" },
  { symbol: "USDCNY", name: "USD/CNY" },
] as const;

function snippetRows(
  quotes: Array<{ symbol: string; price?: number; change?: number; changePercentage?: number }>,
  items: ReadonlyArray<{ symbol: string; name: string }>,
  { fromAbsoluteChange = false }: { fromAbsoluteChange?: boolean } = {},
) {
  const bySymbol = new Map(quotes.map((quote) => [quote.symbol, quote]));
  return items.flatMap((item) => {
    const quote = bySymbol.get(item.symbol);
    if (!quote || quote.price == null) return [];
    const changePercentage = fromAbsoluteChange
      ? percentFromPriceChange(quote.price, quote.change)
      : quote.changePercentage ?? null;
    return [
      {
        symbol: item.symbol,
        name: item.name,
        price: quote.price ?? null,
        changePercentage,
      },
    ];
  });
}

export const metadata = {
  title: "Stock Market",
  description: "U.S. and world indexes, movers, sectors, commodities, crypto, and forex.",
};

export default async function MarketsPage() {
  const today = nyDateString();
  const yesterday = isoDate(addDays(new Date(`${today}T00:00:00Z`), -1));
  const session = nySession();
  const showExtended = session !== "open";
  const extended = nyExtendedCopy();
  const [indexes, world, gainers, losers, active, sectorsToday, sectorsYesterday, commodities, crypto, forex, extendedRows] =
    await Promise.all([
      getIndexQuotes(),
      getWorldIndexQuotes(),
      getGainers(),
      getLosers(),
      getMostActive(),
      getSectorPerformance(today),
      getSectorPerformance(yesterday),
      getCommodityQuotes(),
      getCryptoQuotes(),
      getForexQuotes(),
      showExtended ? getExtendedHoursRows() : Promise.resolve([]),
    ]);
  const sectors = sectorsToday.length ? sectorsToday : sectorsYesterday;
  const indexBySymbol = new Map(indexes.map((quote) => [quote.symbol, quote]));
  const worldBySymbol = new Map(world.map((quote) => [quote.symbol, quote]));

  return (
    <>
      <Container>
        <PageHeader title="Stock Market" description="Indexes, movers, sectors, commodities, crypto, and forex." />
        <SectionNav items={MARKET_NAV} />
        {showExtended ? (
          <div className="mb-12">
            <ExtendedHoursTables
              rows={extendedRows}
              limit={8}
              showActive={false}
              gainerHref={`${extended.href}/gainers`}
              loserHref={`${extended.href}/losers`}
              gainerTitle={`${extended.title} Gainers`}
              loserTitle={`${extended.title} Losers`}
            />
          </div>
        ) : null}
        <div className="grid gap-8 lg:grid-cols-3">
          <MoversTable title="Top Gainers" href="/markets/gainers" rows={gainers.slice(0, 8)} />
          <MoversTable title="Top Losers" href="/markets/losers" rows={losers.slice(0, 8)} />
          <MoversTable title="Most Active" href="/markets/active" rows={active.slice(0, 8)} />
        </div>
        <div className="mt-12 grid gap-8 lg:grid-cols-2">
          <MarketQuotesTable
            title="U.S. Indexes"
            href="/markets/indexes"
            rows={INDEX_SYMBOLS.map((item) => {
              const quote = indexBySymbol.get(item.symbol);
              return {
                symbol: item.symbol,
                name: INDEX_LABELS[item.symbol] ?? item.label,
                price: quote?.price ?? null,
                changePercentage: quote?.changePercentage ?? null,
              };
            })}
            linkSymbols
          />
          <MarketQuotesTable
            title="World Markets"
            href="/markets/global"
            extraLabel="Region"
            rows={WORLD_INDEX_SYMBOLS.slice(0, 8).map((item) => {
              const quote = worldBySymbol.get(item.symbol);
              return {
                symbol: item.symbol,
                name: INDEX_LABELS[item.symbol] ?? item.label,
                extra: item.region,
                price: quote?.price ?? null,
                changePercentage: quote?.changePercentage ?? null,
              };
            })}
            linkSymbols
          />
          <MarketQuotesTable
            title="Commodities"
            href="/markets/commodities"
            rows={snippetRows(commodities, COMMODITY_SNIPPET, { fromAbsoluteChange: true })}
            alreadyPercent={false}
            linkSymbols
          />
          <MarketQuotesTable
            title="Cryptocurrency"
            href="/markets/crypto"
            rows={snippetRows(crypto, CRYPTO_SNIPPET, { fromAbsoluteChange: true })}
            alreadyPercent={false}
            linkSymbols
          />
          <MarketQuotesTable
            title="Forex"
            href="/markets/forex"
            rows={snippetRows(forex, FOREX_SNIPPET, { fromAbsoluteChange: true })}
            alreadyPercent={false}
            priceDigits={4}
            linkSymbols
          />
        </div>
        <section className="mt-12">
          <div className="mb-3 flex items-end justify-between gap-3">
            <h2 className="text-xl font-semibold text-header">Sector Performance</h2>
            <div className="flex gap-4">
              <Link href="/markets/heatmap" className="text-sm text-link hover:underline">
                Heatmap
              </Link>
              <Link href="/markets/sectors" className="text-sm text-link hover:underline">
                Full table
              </Link>
            </div>
          </div>
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="sa-table">
              <thead>
                <tr>
                  <th>Sector</th>
                  <th className="num">Avg Change</th>
                </tr>
              </thead>
              <tbody>
                {sectors.length === 0 ? (
                  <tr>
                    <td colSpan={2} className="text-muted">
                      Sector snapshot is unavailable for the latest session.
                    </td>
                  </tr>
                ) : (
                  [...sectors]
                    .sort((a, b) => b.averageChange - a.averageChange)
                    .map((row) => (
                      <tr key={row.sector}>
                        <td>{row.sector}</td>
                        <td className="num">
                          <ChangePercent value={row.averageChange} alreadyPercent />
                        </td>
                      </tr>
                    ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </Container>
    </>
  );
}
