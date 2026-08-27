import Link from "next/link";
import { Container } from "@/components/container";
import { PageHeader } from "@/components/page-header";
import { ChangePercent } from "@/components/change";
import { compactMoneyFn, formatDate, formatInteger, formatMoney } from "@/lib/format";
import { getFullDailyChart, getHistoricalMarketCap, getProfile, getSplits } from "@/lib/fmp";
import { addDays, isoDate, nyDateString } from "@/lib/utils";

export default async function StockHistoryPage({ params }: { params: Promise<{ symbol: string }> }) {
  const { symbol } = await params;
  const ticker = symbol.toUpperCase();
  const today = nyDateString();
  const from = isoDate(addDays(new Date(`${today}T00:00:00Z`), -400));
  const [prices, marketCaps, splits, profile] = await Promise.all([
    getFullDailyChart(ticker, from, today),
    getHistoricalMarketCap(ticker, 90),
    getSplits(ticker, 20),
    getProfile(ticker),
  ]);
  const money = compactMoneyFn(profile?.currency);
  const px = (value: number | null | undefined) => formatMoney(value, profile?.currency);
  const daily = [...prices].sort((a, b) => b.date.localeCompare(a.date));
  const caps = [...marketCaps].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <Container>
      <PageHeader
        title={`${ticker} Historical Data`}
        description="Daily prices, market capitalization, and stock split history."
      />

      <section>
        <h2 className="mb-3 text-lg font-semibold text-header">Daily Prices</h2>
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="sa-table">
            <thead>
              <tr>
                <th>Date</th>
                <th className="num">Open</th>
                <th className="num">High</th>
                <th className="num">Low</th>
                <th className="num">Close</th>
                <th className="num">Change</th>
                <th className="num">Volume</th>
              </tr>
            </thead>
            <tbody>
              {daily.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-muted">
                    No price history available.
                  </td>
                </tr>
              ) : (
                daily.slice(0, 120).map((row) => (
                  <tr key={row.date}>
                    <td>{formatDate(row.date)}</td>
                    <td className="num">{px(row.open)}</td>
                    <td className="num">{px(row.high)}</td>
                    <td className="num">{px(row.low)}</td>
                    <td className="num">{px(row.close)}</td>
                    <td className="num">
                      <ChangePercent value={row.changePercent} />
                    </td>
                    <td className="num">{formatInteger(row.volume)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-10">
        <div className="mb-3 flex items-end justify-between">
          <h2 className="text-lg font-semibold text-header">Market Cap</h2>
          <Link href={`/stocks/${ticker}/market-cap`} className="text-sm text-link hover:underline">
            Full history
          </Link>
        </div>
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="sa-table">
            <thead>
              <tr>
                <th>Date</th>
                <th className="num">Market Cap</th>
              </tr>
            </thead>
            <tbody>
              {caps.slice(0, 60).map((row) => (
                <tr key={row.date}>
                  <td>{formatDate(row.date)}</td>
                  <td className="num">{money(row.marketCap)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-10">
        <h2 className="mb-3 text-lg font-semibold text-header">Stock Splits</h2>
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="sa-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Ratio</th>
                <th>Type</th>
              </tr>
            </thead>
            <tbody>
              {splits.length === 0 ? (
                <tr>
                  <td colSpan={3} className="text-muted">
                    No split history.
                  </td>
                </tr>
              ) : (
                splits.map((row) => (
                  <tr key={`${row.date}-${row.numerator}-${row.denominator}`}>
                    <td>{formatDate(row.date)}</td>
                    <td>
                      {row.numerator}:{row.denominator}
                    </td>
                    <td className="capitalize">{row.splitType?.replace("-", " ") || "Stock split"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </Container>
  );
}
