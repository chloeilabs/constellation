import { Container } from "@/components/container";
import { HistoryBars } from "@/components/history-bars";
import { InsiderTable } from "@/components/insider-table";
import { MetricCards } from "@/components/metric-cards";
import { PageHeader } from "@/components/page-header";
import { formatCompact, formatInteger, formatNumber } from "@/lib/format";
import { TablePager } from "@/components/table-pager";
import { getInsiderStatistics, getInsiderTradesArchive } from "@/lib/fmp";
import { decodeTicker, stockPath } from "@/lib/listings";
import { pageNumber, paginate, pagerLinks } from "@/lib/paging";
import { addDays, isoDate, nyDateString } from "@/lib/utils";

function netShares(acquired: number | null | undefined, disposed: number | null | undefined) {
  return (acquired || 0) - (disposed || 0);
}

function signedShares(value: number) {
  const text = formatCompact(Math.abs(value));
  if (value > 0) return <span className="text-gain">+{text}</span>;
  if (value < 0) return <span className="text-loss">−{text}</span>;
  return text;
}

export default async function StockInsidersPage({
  params,
  searchParams,
}: {
  params: Promise<{ symbol: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { symbol } = await params;
  const { page: pageParam } = await searchParams;
  const ticker = decodeTicker(symbol);
  const [rows, stats] = await Promise.all([getInsiderTradesArchive(ticker), getInsiderStatistics(ticker)]);
  const filings = paginate(rows, pageNumber(pageParam));
  const recent = [...stats].sort((a, b) => b.year - a.year || b.quarter - a.quarter).slice(0, 12);
  const latest = recent[0] ?? null;
  const trailing4 = recent.slice(0, 4);
  const trailingNet = trailing4.reduce((sum, row) => sum + netShares(row.totalAcquired, row.totalDisposed), 0);
  const cutoff = isoDate(addDays(new Date(`${nyDateString()}T00:00:00Z`), -90));
  const last90 = rows.filter((row) => (row.transactionDate || row.filingDate).slice(0, 10) >= cutoff);
  const bought90 = last90
    .filter((row) => row.acquisitionOrDisposition === "A")
    .reduce((sum, row) => sum + (row.securitiesTransacted || 0), 0);
  const sold90 = last90
    .filter((row) => row.acquisitionOrDisposition === "D")
    .reduce((sum, row) => sum + (row.securitiesTransacted || 0), 0);
  const chartItems = [...recent].reverse().map((row) => ({
    label: `Q${row.quarter} ${String(row.year).slice(2)}`,
    value: netShares(row.totalAcquired, row.totalDisposed),
  }));

  return (
    <Container>
      <PageHeader
        title={`${ticker} Insider Trading`}
        description="Form 4 purchases and sales reported by officers, directors, and 10% owners, plus quarterly FMP statistics. Net activity is shares bought minus shares sold."
      />
      {latest ? (
        <MetricCards
          items={[
            {
              label: `Net shares Q${latest.quarter} ${latest.year}`,
              value: signedShares(netShares(latest.totalAcquired, latest.totalDisposed)),
              hint: `${formatInteger(latest.acquiredTransactions)} buys / ${formatInteger(latest.disposedTransactions)} sells`,
            },
            {
              label: "Trailing 4Q net",
              value: signedShares(trailingNet),
              hint: `${trailing4.length} quarters of FMP statistics`,
            },
            {
              label: "Last 90 days (Form 4)",
              value: signedShares(bought90 - sold90),
              hint: `${formatCompact(bought90)} acquired / ${formatCompact(sold90)} disposed`,
            },
            {
              label: "Buy / sell ratio",
              value: formatNumber(latest.acquiredDisposedRatio),
              hint: "Acquired transactions ÷ disposed",
            },
          ]}
        />
      ) : null}
      {chartItems.length > 1 ? (
        <section className="mt-8">
          <h2 className="mb-3 text-lg font-semibold text-header">Net Insider Shares</h2>
          <p className="mb-3 text-sm text-muted">
            Quarterly shares acquired minus shares disposed. Green is net buying; red is net selling.
          </p>
          <HistoryBars items={chartItems} formatValue={(value) => `${value >= 0 ? "+" : "−"}${formatCompact(Math.abs(value))}`} />
        </section>
      ) : null}
      {recent.length > 0 ? (
        <section className="mt-8">
          <h2 className="mb-3 text-lg font-semibold text-header">Quarterly Statistics</h2>
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="sa-table">
              <thead>
                <tr>
                  <th>Period</th>
                  <th className="num">Buys</th>
                  <th className="num">Sells</th>
                  <th className="num">Shares Bought</th>
                  <th className="num">Shares Sold</th>
                  <th className="num">Net</th>
                  <th className="num">Buy / Sell</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((row) => {
                  const net = netShares(row.totalAcquired, row.totalDisposed);
                  return (
                    <tr key={`${row.year}-${row.quarter}`}>
                      <td>
                        {row.year} Q{row.quarter}
                      </td>
                      <td className="num">{formatInteger(row.acquiredTransactions)}</td>
                      <td className="num">{formatInteger(row.disposedTransactions)}</td>
                      <td className="num">{formatInteger(row.totalAcquired)}</td>
                      <td className="num">{formatInteger(row.totalDisposed)}</td>
                      <td className="num">{signedShares(net)}</td>
                      <td className="num">{formatNumber(row.acquiredDisposedRatio)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}
      <div className="mt-8">
        <h2 className="mb-3 text-lg font-semibold text-header">Recent Form 4 Filings</h2>
        <InsiderTable rows={filings.rows} showSymbol={false} empty={`No recent insider trades for ${ticker}.`} />
        <TablePager
          from={filings.from}
          to={filings.to}
          total={filings.total}
          page={filings.page}
          pageCount={filings.pageCount}
          {...pagerLinks(stockPath(ticker, "/insiders"), filings.page, filings.pageCount)}
        />
      </div>
    </Container>
  );
}
