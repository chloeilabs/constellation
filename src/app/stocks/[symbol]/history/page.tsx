import Link from "next/link";
import { Container } from "@/components/container";
import { DownloadCsvButton } from "@/components/download-csv";
import { PageHeader, RangeToggle } from "@/components/page-header";
import { ChangePercent } from "@/components/change";
import { compactMoneyFn, formatDate, formatInteger, formatMoney, formatPrice } from "@/lib/format";
import { getDividendAdjustedChart, getFullDailyChart, getHistoricalMarketCap, getProfile, getSplits } from "@/lib/fmp";
import { indexDisplayName, isIndexTicker } from "@/lib/indexes";
import { decodeTicker, stockPath } from "@/lib/listings";
import { addDays, isoDate, nyDateString } from "@/lib/utils";
import type { FmpFullCandle } from "@/lib/types";

function historyRange(value?: string): "6" | "1" | "5" | "10" | "max" {
  if (value === "1" || value === "5" || value === "10" || value === "max") return value;
  return "6";
}

function historyFrom(range: "6" | "1" | "5" | "10" | "max", today: string) {
  if (range === "max") return "1970-01-01";
  const days =
    range === "6" ? 200 : range === "1" ? 400 : range === "5" ? 365 * 5 + 20 : 365 * 10 + 20;
  return isoDate(addDays(new Date(`${today}T00:00:00Z`), -days));
}

function historyCapLimit(range: "6" | "1" | "5" | "10" | "max") {
  return range === "6" ? 220 : range === "1" ? 400 : range === "5" ? 1500 : range === "10" ? 2800 : 5000;
}

function finite(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

/** Session change versus the previous close, matching Stock Analysis history. */
function withSessionChange(rows: FmpFullCandle[], adjCloseByDate?: Map<string, number>) {
  const chronological = [...rows].sort((a, b) => a.date.localeCompare(b.date));
  return chronological
    .map((row, index) => {
      const prev = chronological[index - 1];
      const closeChangePercent =
        prev && prev.close ? ((row.close - prev.close) / prev.close) * 100 : finite(row.changePercent);
      return {
        ...row,
        adjClose: adjCloseByDate?.get(row.date) ?? null,
        closeChangePercent,
      };
    })
    .reverse();
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
  const [prices, adjusted, marketCaps, splits, profile] = await Promise.all([
    getFullDailyChart(ticker, from, today),
    index ? Promise.resolve([]) : getDividendAdjustedChart(ticker, from, today),
    index ? Promise.resolve([]) : getHistoricalMarketCap(ticker, historyCapLimit(range), from, today),
    index ? Promise.resolve([]) : getSplits(ticker, 20),
    index ? Promise.resolve(null) : getProfile(ticker),
  ]);
  const money = compactMoneyFn(profile?.currency);
  const px = (value: number | null | undefined) => (index ? formatPrice(value) : formatMoney(value, profile?.currency));
  const adjCloseByDate = new Map(
    adjusted
      .map((row) => [row.date, finite(row.adjClose)] as const)
      .filter((entry): entry is readonly [string, number] => entry[1] != null),
  );
  const daily = withSessionChange(prices, index ? undefined : adjCloseByDate);
  const caps = [...marketCaps].sort((a, b) => b.date.localeCompare(a.date));
  const shown = daily.slice(0, 250);
  const shownCaps = caps.slice(0, 250);
  const showAdjClose = !index;

  return (
    <Container>
      <PageHeader
        title={`${index ? indexDisplayName(ticker) : ticker} Historical Data`}
        description={
          index
            ? "Daily index levels from Financial Modeling Prep."
            : "Daily prices, dividend-adjusted close, market capitalization, and stock split history."
        }
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <RangeToggle
              range={range}
              sixHref={base}
              oneHref={`${base}?years=1`}
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
              filename={`${ticker}-history-${range === "max" ? "max" : range === "6" ? "6m" : `${range}y`}`}
              headers={
                showAdjClose
                  ? ["Date", "Open", "High", "Low", "Close", "Adj. Close", "Change %", "Volume"]
                  : ["Date", "Open", "High", "Low", "Close", "Change %", "Volume"]
              }
              rows={daily.map((row) =>
                showAdjClose
                  ? [row.date, row.open, row.high, row.low, row.close, row.adjClose, row.closeChangePercent, row.volume]
                  : [row.date, row.open, row.high, row.low, row.close, row.closeChangePercent, row.volume],
              )}
            />
          ) : null}
        </div>
        <p className="mb-2 text-xs text-muted">
          {shown.length < daily.length
            ? `Showing the latest ${shown.length.toLocaleString("en-US")} of ${daily.length.toLocaleString("en-US")} sessions. Download CSV for the full window.`
            : `${daily.length.toLocaleString("en-US")} sessions in this window.`}
          {showAdjClose
            ? " Adj. Close is FMP dividend-adjusted. Change is versus the previous session close."
            : " Change is versus the previous session close."}
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
                {showAdjClose ? <th className="num">Adj. Close</th> : null}
                <th className="num">Change</th>
                <th className="num">Volume</th>
              </tr>
            </thead>
            <tbody>
              {shown.length === 0 ? (
                <tr>
                  <td colSpan={showAdjClose ? 8 : 7} className="text-muted">
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
                    {showAdjClose ? <td className="num">{px(row.adjClose)}</td> : null}
                    <td className="num">
                      <ChangePercent value={row.closeChangePercent} />
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
            <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
              <h2 className="text-lg font-semibold text-header">Market Cap</h2>
              <div className="flex flex-wrap items-center gap-3">
                {caps.length ? (
                  <DownloadCsvButton
                    filename={`${ticker}-market-cap-${range === "max" ? "max" : `${range}y`}`}
                    headers={["Date", "Market Cap"]}
                    rows={caps.map((row) => [row.date, row.marketCap])}
                  />
                ) : null}
                <Link href={stockPath(ticker, "/market-cap")} className="text-sm text-link hover:underline">
                  Full history
                </Link>
              </div>
            </div>
            <p className="mb-2 text-xs text-muted">
              {shownCaps.length < caps.length
                ? `Showing the latest ${shownCaps.length.toLocaleString("en-US")} of ${caps.length.toLocaleString("en-US")} sessions. Download CSV for the full window.`
                : `${caps.length.toLocaleString("en-US")} sessions in this window.`}
            </p>
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="sa-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th className="num">Market Cap</th>
                  </tr>
                </thead>
                <tbody>
                  {shownCaps.length === 0 ? (
                    <tr>
                      <td colSpan={2} className="text-muted">
                        No market cap history available.
                      </td>
                    </tr>
                  ) : (
                    shownCaps.map((row) => (
                      <tr key={row.date}>
                        <td>{formatDate(row.date)}</td>
                        <td className="num">{money(row.marketCap)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <section className="mt-10">
            <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
              <h2 className="text-lg font-semibold text-header">Stock Splits</h2>
              <Link href={stockPath(ticker, "/splits")} className="text-sm text-link hover:underline">
                Full history
              </Link>
            </div>
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
