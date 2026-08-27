import Link from "next/link";
import { Container } from "@/components/container";
import { DownloadCsvButton } from "@/components/download-csv";
import { PageHeader, RangeToggle } from "@/components/page-header";
import { ChangePercent } from "@/components/change";
import { compactMoneyFn, formatDate, formatInteger, formatMoney, formatPrice } from "@/lib/format";
import { getFullDailyChart, getHistoricalMarketCap, getProfile, getSplits } from "@/lib/fmp";
import { indexDisplayName, isIndexTicker } from "@/lib/indexes";
import { decodeTicker, stockPath } from "@/lib/listings";
import { addDays, isoDate, nyDateString } from "@/lib/utils";

function historyRange(value?: string): "1" | "5" | "10" | "max" {
  if (value === "5" || value === "10" || value === "max") return value;
  return "1";
}

function historyFrom(range: "1" | "5" | "10" | "max", today: string) {
  const days = range === "1" ? 400 : range === "5" ? 365 * 5 + 20 : range === "10" ? 365 * 10 + 20 : 365 * 20 + 40;
  return isoDate(addDays(new Date(`${today}T00:00:00Z`), -days));
}

export default async function StockHistoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ symbol: string }>;
  searchParams: Promise<{ years?: string }>;
}) {
  const { symbol } = await params;
  const { years: yearsParam } = await searchParams;
  const ticker = decodeTicker(symbol);
  const index = isIndexTicker(ticker);
  const range = historyRange(yearsParam);
  const today = nyDateString();
  const from = historyFrom(range, today);
  const base = stockPath(ticker, "/history");
  const [prices, marketCaps, splits, profile] = await Promise.all([
    getFullDailyChart(ticker, from, today),
    index ? Promise.resolve([]) : getHistoricalMarketCap(ticker, 90),
    index ? Promise.resolve([]) : getSplits(ticker, 20),
    index ? Promise.resolve(null) : getProfile(ticker),
  ]);
  const money = compactMoneyFn(profile?.currency);
  const px = (value: number | null | undefined) => (index ? formatPrice(value) : formatMoney(value, profile?.currency));
  const daily = [...prices].sort((a, b) => b.date.localeCompare(a.date));
  const caps = [...marketCaps].sort((a, b) => b.date.localeCompare(a.date));
  const shown = daily.slice(0, 250);

  return (
    <Container>
      <PageHeader
        title={`${index ? indexDisplayName(ticker) : ticker} Historical Data`}
        description={
          index
            ? "Daily index levels from Financial Modeling Prep."
            : "Daily prices, market capitalization, and stock split history."
        }
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <RangeToggle
              range={range}
              oneHref={base}
              fiveHref={`${base}?years=5`}
              tenHref={`${base}?years=10`}
              maxHref={`${base}?years=max`}
            />
            <Link
              href={`/tools/return-calculator?symbol=${encodeURIComponent(ticker)}&start=${from}&end=${today}`}
              className="inline-flex items-center rounded-md border border-border-strong px-3 py-1.5 text-sm font-medium hover:bg-muted-bg"
            >
              Return Calculator
            </Link>
          </div>
        }
      />

      <section>
        <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
          <h2 className="text-lg font-semibold text-header">Daily Prices</h2>
          {daily.length ? (
            <DownloadCsvButton
              filename={`${ticker}-history-${range === "max" ? "max" : `${range}y`}`}
              headers={["Date", "Open", "High", "Low", "Close", "Change %", "Volume"]}
              rows={daily.map((row) => [row.date, row.open, row.high, row.low, row.close, row.changePercent, row.volume])}
            />
          ) : null}
        </div>
        <p className="mb-2 text-xs text-muted">
          {shown.length < daily.length
            ? `Showing the latest ${shown.length.toLocaleString("en-US")} of ${daily.length.toLocaleString("en-US")} sessions. Download CSV for the full window.`
            : `${daily.length.toLocaleString("en-US")} sessions in this window.`}
        </p>
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
              {shown.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-muted">
                    No price history available.
                  </td>
                </tr>
              ) : (
                shown.map((row) => (
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

      {index ? null : (
        <>
          <section className="mt-10">
            <div className="mb-3 flex items-end justify-between">
              <h2 className="text-lg font-semibold text-header">Market Cap</h2>
              <Link href={stockPath(ticker, "/market-cap")} className="text-sm text-link hover:underline">
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
        </>
      )}
    </Container>
  );
}
