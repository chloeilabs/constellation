import Link from "next/link";
import { Container } from "@/components/container";
import { DailyPriceTable } from "@/components/daily-price-table";
import { DownloadCsvLink } from "@/components/download-csv-link";
import { PageHeader, RangeToggle } from "@/components/page-header";
import { TablePager } from "@/components/table-pager";
import { compactMoneyFn, formatDate, formatMoney, formatPrice } from "@/lib/format";
import { getHistoricalMarketCap, getProfile, getSplits } from "@/lib/fmp";
import { historyCapLimit, historyFrom, historyRange } from "@/lib/history";
import { indexDisplayName, isIndexTicker } from "@/lib/indexes";
import { decodeTicker, stockPath } from "@/lib/listings";
import { pageNumber, paginate, pagerLinks } from "@/lib/paging";
import { loadDailyPriceHistory } from "@/lib/price-history";
import { nyDateString } from "@/lib/utils";

export default async function StockHistoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ symbol: string }>;
  searchParams: Promise<{ years?: string; page?: string }>;
}) {
  const { symbol } = await params;
  const { years: yearsParam, page: pageParam } = await searchParams;
  const ticker = decodeTicker(symbol);
  const index = isIndexTicker(ticker);
  const range = historyRange(yearsParam);
  const today = nyDateString();
  const from = historyFrom(range, today);
  const base = stockPath(ticker, "/history");
  const [{ daily, yearsQuery, rangeSlug }, marketCaps, splits, profile] = await Promise.all([
    loadDailyPriceHistory(ticker, yearsParam, { adjusted: !index }),
    index ? Promise.resolve([]) : getHistoricalMarketCap(ticker, historyCapLimit(range), from, today),
    index ? Promise.resolve([]) : getSplits(ticker, 20),
    index ? Promise.resolve(null) : getProfile(ticker),
  ]);
  const money = compactMoneyFn(profile?.currency);
  const px = (value: number | null | undefined) => (index ? formatPrice(value) : formatMoney(value, profile?.currency));
  const caps = [...marketCaps].sort((a, b) => b.date.localeCompare(a.date));
  const pricePage = paginate(daily, pageNumber(pageParam));
  const capPage = paginate(caps, pageNumber(pageParam));
  const extra = { years: yearsQuery };
  const capLinks = pagerLinks(base, capPage.page, capPage.pageCount, extra);
  const csvQuery = new URLSearchParams();
  if (yearsQuery) csvQuery.set("years", yearsQuery);
  const pricesCsvHref = csvQuery.size ? `${base}/csv?${csvQuery}` : `${base}/csv`;
  const capCsv = new URLSearchParams(csvQuery);
  capCsv.set("table", "market-cap");
  const marketCapCsvHref = `${base}/csv?${capCsv}`;

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
              className="sa-btn sa-btn-secondary"
            >
              Return Calculator
            </Link>
          </div>
        }
      />

      <DailyPriceTable
        rows={pricePage.rows}
        from={pricePage.from}
        to={pricePage.to}
        total={pricePage.total}
        page={pricePage.page}
        pageCount={pricePage.pageCount}
        path={base}
        extra={extra}
        csvHref={daily.length ? pricesCsvHref : undefined}
        rangeSlug={rangeSlug}
        formatPrice={px}
        showAdjClose={!index}
      />

      {index ? null : (
        <>
          <section className="mt-10">
            <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
              <h2 className="text-lg font-semibold text-header">Market Cap</h2>
              <div className="flex flex-wrap items-center gap-3">
                {caps.length ? <DownloadCsvLink href={marketCapCsvHref} /> : null}
                <Link href={stockPath(ticker, "/market-cap")} className="text-sm text-link hover:underline">
                  Full history
                </Link>
              </div>
            </div>
            <p className="mb-2 text-xs text-muted">Download CSV for the full {rangeSlug} window.</p>
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="sa-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th className="num">Market Cap</th>
                  </tr>
                </thead>
                <tbody>
                  {capPage.rows.length === 0 ? (
                    <tr>
                      <td colSpan={2} className="text-muted">
                        No market cap history available.
                      </td>
                    </tr>
                  ) : (
                    capPage.rows.map((row) => (
                      <tr key={row.date}>
                        <td>{formatDate(row.date)}</td>
                        <td className="num">{money(row.marketCap)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <TablePager
              from={capPage.from}
              to={capPage.to}
              total={capPage.total}
              page={capPage.page}
              pageCount={capPage.pageCount}
              {...capLinks}
            />
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
