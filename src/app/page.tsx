import Link from "next/link";
import { SearchBox } from "@/components/search-box";
import { IndexTicker } from "@/components/index-ticker";
import { MoversTable } from "@/components/movers-table";
import { NewsList } from "@/components/news-list";
import { Container } from "@/components/container";
import { PopularStocks } from "@/components/popular-stocks";
import { SectorStrip } from "@/components/sector-strip";
import { Toolkit } from "@/components/toolkit";
import { ExtendedHoursTables } from "@/components/extended-hours-tables";
import { formatDate, formatPrice } from "@/lib/format";
import {
  getEarningsCalendar,
  getGainers,
  getIndexConstituents,
  getIndexQuotes,
  getIpos,
  getLosers,
  getMarketHours,
  getMostActive,
  getQuotes,
  getSectorPerformance,
  getStockNews,
  POPULAR_SYMBOLS,
} from "@/lib/fmp";
import { getExtendedHoursRows } from "@/lib/extended-hours";
import { quoteHref } from "@/lib/listings";
import { addDays, isoDate, nyDateString, nyExtendedCopy, nySession } from "@/lib/utils";
import type { FmpEarnings, FmpIpo } from "@/lib/types";

const MARKET_LINKS = [
  ["/markets/premarket", "Pre-Market"],
  ["/markets/afterhours", "After Hours"],
  ["/markets/heatmap", "Heatmap"],
  ["/markets/global", "World Markets"],
  ["/markets/sectors", "Sectors"],
  ["/markets/industries", "Industries"],
  ["/markets/treasury", "Treasury"],
  ["/list/magnificent-seven", "Mag 7"],
  ["/list/faang", "FAANG"],
  ["/list/ai-stocks", "AI"],
  ["/list/ev-stocks", "EVs"],
  ["/list/glp1-stocks", "GLP-1"],
  ["/list/apparel-stocks", "Apparel"],
  ["/list/bdc-stocks", "BDCs"],
  ["/list/top-rated", "Top Rated"],
  ["/list/top-rated-dividend-stocks", "Top-Rated Dividends"],
  ["/list/bitcoin-etfs", "Bitcoin ETFs"],
  ["/list/highest-revenue", "Revenue"],
  ["/list/dividend-aristocrats", "Aristocrats"],
  ["/list/reit-stocks", "REITs"],
  ["/list/52-week-high", "52-Week High"],
] as const;

function IpoTable({ title, rows }: { title: string; rows: FmpIpo[] }) {
  return (
    <section>
      <h2 className="mb-3 text-xl font-semibold text-header">{title}</h2>
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="sa-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Symbol</th>
              <th>Name</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={3} className="text-muted">
                  No IPOs in this window.
                </td>
              </tr>
            ) : (
              rows.map((ipo) => (
                <tr key={`${ipo.symbol}-${ipo.date}`}>
                  <td>{formatDate(ipo.date)}</td>
                  <td className="symbol">
                    {ipo.symbol ? (
                      <Link href={quoteHref(ipo.symbol, { name: ipo.company })} className="text-link hover:underline">
                        {ipo.symbol}
                      </Link>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="max-w-[260px] truncate">{ipo.company}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function EarningsTable({ title, rows }: { title: string; rows: FmpEarnings[] }) {
  return (
    <section>
      <h2 className="mb-3 text-xl font-semibold text-header">{title}</h2>
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="sa-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Symbol</th>
              <th className="num">EPS Est.</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={3} className="text-muted">
                  No S&P 500 earnings in this window.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={`${row.symbol}-${row.date}`}>
                  <td>{formatDate(row.date)}</td>
                  <td className="symbol">
                    <Link href={quoteHref(row.symbol)} className="text-link hover:underline">
                      {row.symbol}
                    </Link>
                  </td>
                  <td className="num">{formatPrice(row.epsEstimated)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default async function HomePage() {
  const today = new Date(`${nyDateString()}T00:00:00Z`);
  const from = isoDate(addDays(today, -30));
  const to = isoDate(addDays(today, 30));
  const todayStr = nyDateString();
  const yesterday = isoDate(addDays(today, -1));
  const session = nySession();
  const showExtended = session !== "open";
  const extended = nyExtendedCopy();
  const [indexes, gainers, losers, news, ipos, hours, popular, actives, sectorsToday, sectorsYesterday, extendedRows, earnings, sp500] =
    await Promise.all([
      getIndexQuotes(),
      showExtended ? Promise.resolve([]) : getGainers(),
      showExtended ? Promise.resolve([]) : getLosers(),
      getStockNews(20),
      getIpos(from, to),
      getMarketHours("NASDAQ"),
      getQuotes([...POPULAR_SYMBOLS]),
      getMostActive(),
      getSectorPerformance(todayStr),
      getSectorPerformance(yesterday),
      showExtended ? getExtendedHoursRows() : Promise.resolve([]),
      getEarningsCalendar(todayStr, isoDate(addDays(today, 7))),
      getIndexConstituents("sp500"),
    ]);

  const recentIpos = ipos.filter((ipo) => ipo.date <= todayStr).slice(0, 8);
  const upcomingIpos = ipos.filter((ipo) => ipo.date > todayStr).slice(0, 8);
  const spSet = new Set(sp500.map((row) => row.symbol));
  const spEarnings = earnings.filter((row) => spSet.has(row.symbol)).slice(0, 8);
  const sectors = sectorsToday.length ? sectorsToday : sectorsYesterday;

  return (
    <>
      <IndexTicker quotes={indexes} hours={hours} />
      <section className="border-b border-border bg-gradient-to-b from-muted-bg to-white">
        <div className="mx-auto max-w-3xl px-4 py-16 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-header md:text-5xl">
            Search for a stock to start your analysis
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-muted">
            All-in-one stock analysis platform with prices, news, financials, forecasts, charts, and a stock screener.
            Data from Financial Modeling Prep.
          </p>
          <div className="mt-8">
            <SearchBox large autoFocus />
          </div>
          {actives.length > 0 ? (
            <p className="mt-6 text-sm text-muted">
              Trending:{" "}
              {actives.slice(0, 4).map((row, index) => (
                <span key={row.symbol}>
                  <Link
                    href={quoteHref(row.symbol, { name: row.name, exchange: row.exchange })}
                    className="font-semibold text-header hover:text-brand"
                  >
                    {row.symbol}
                  </Link>
                  {index < 3 ? ", " : " "}
                </span>
              ))}
              <Link href="/markets/active" className="text-link hover:underline">
                More
              </Link>
            </p>
          ) : null}
          <PopularStocks quotes={popular} />
        </div>
      </section>
      <Container>
        <nav className="mb-8 flex flex-wrap gap-2">
          {MARKET_LINKS.map(([href, label]) => (
            <Link
              key={href}
              href={href}
              className="rounded-full border border-border bg-white px-3 py-1.5 text-sm font-medium text-header hover:border-border-strong hover:bg-muted-bg"
            >
              {label}
            </Link>
          ))}
        </nav>
        <SectorStrip rows={sectors} />
        {showExtended ? (
          <div className="mt-12">
            <ExtendedHoursTables
              rows={extendedRows}
              limit={10}
              showActive={false}
              gainerHref={`${extended.href}/gainers`}
              loserHref={`${extended.href}/losers`}
              gainerTitle={`${extended.title} Gainers`}
              loserTitle={`${extended.title} Losers`}
            />
          </div>
        ) : (
          <div className="mt-12 grid gap-8 lg:grid-cols-2">
            <MoversTable title="Top Gainers" href="/markets/gainers" rows={gainers.slice(0, 10)} />
            <MoversTable title="Top Losers" href="/markets/losers" rows={losers.slice(0, 10)} />
          </div>
        )}
        <div className="mt-12">
          <Toolkit />
        </div>
        <div className="mt-12 grid gap-8 lg:grid-cols-[1.4fr_1fr]">
          <section>
            <div className="mb-3 flex items-end justify-between">
              <h2 className="text-xl font-semibold text-header">Market News</h2>
              <Link href="/news" className="text-sm text-link hover:underline">
                More News
              </Link>
            </div>
            <NewsList items={news.slice(0, 12)} />
          </section>
          <div className="space-y-8">
            <IpoTable title="Recent IPOs" rows={recentIpos} />
            <IpoTable title="Upcoming IPOs" rows={upcomingIpos} />
            <EarningsTable title="S&P 500 Earnings" rows={spEarnings} />
            <p className="text-sm">
              <Link href="/calendar/ipos" className="text-link hover:underline">
                Full IPO calendar
              </Link>
              {" · "}
              <Link href="/calendar/earnings" className="text-link hover:underline">
                Earnings calendar
              </Link>
            </p>
          </div>
        </div>
      </Container>
    </>
  );
}
