import Link from "next/link";
import { SearchBox } from "@/components/search-box";
import { IndexTicker } from "@/components/index-ticker";
import { MoversTable } from "@/components/movers-table";
import { NewsList } from "@/components/news-list";
import { Container } from "@/components/container";
import { PopularStocks } from "@/components/popular-stocks";
import { Toolkit } from "@/components/toolkit";
import { formatDate } from "@/lib/format";
import {
  getGainers,
  getIndexQuotes,
  getIpos,
  getLosers,
  getMarketHours,
  getMostActive,
  getQuotes,
  getStockNews,
  POPULAR_SYMBOLS,
} from "@/lib/fmp";
import { addDays, isoDate, nyDateString } from "@/lib/utils";
import type { FmpIpo } from "@/lib/types";

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
                      <Link href={`/stocks/${ipo.symbol}`} className="text-link hover:underline">
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

export default async function HomePage() {
  const today = new Date(`${nyDateString()}T00:00:00Z`);
  const from = isoDate(addDays(today, -30));
  const to = isoDate(addDays(today, 30));
  const [indexes, gainers, losers, news, ipos, hours, popular, actives] = await Promise.all([
    getIndexQuotes(),
    getGainers(),
    getLosers(),
    getStockNews(20),
    getIpos(from, to),
    getMarketHours("NASDAQ"),
    getQuotes([...POPULAR_SYMBOLS]),
    getMostActive(),
  ]);

  const todayStr = nyDateString();
  const recentIpos = ipos.filter((ipo) => ipo.date <= todayStr).slice(0, 8);
  const upcomingIpos = ipos.filter((ipo) => ipo.date > todayStr).slice(0, 8);

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
                  <Link href={`/stocks/${row.symbol}`} className="font-semibold text-header hover:text-brand">
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
        <div className="grid gap-8 lg:grid-cols-2">
          <MoversTable title="Top Gainers" href="/markets/gainers" rows={gainers.slice(0, 10)} />
          <MoversTable title="Top Losers" href="/markets/losers" rows={losers.slice(0, 10)} />
        </div>
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
            <p className="text-sm">
              <Link href="/calendar/ipos" className="text-link hover:underline">
                Full IPO calendar
              </Link>
            </p>
          </div>
        </div>
      </Container>
    </>
  );
}
