import { Container } from "@/components/container";
import { InsiderTable } from "@/components/insider-table";
import { PageHeader } from "@/components/page-header";
import { formatInteger, formatNumber } from "@/lib/format";
import { getInsiderStatistics, getInsiderTrades } from "@/lib/fmp";

export default async function StockInsidersPage({ params }: { params: Promise<{ symbol: string }> }) {
  const { symbol } = await params;
  const ticker = symbol.toUpperCase();
  const [rows, stats] = await Promise.all([getInsiderTrades(ticker, 75), getInsiderStatistics(ticker)]);
  const recent = [...stats].sort((a, b) => b.year - a.year || b.quarter - a.quarter).slice(0, 8);

  return (
    <Container>
      <PageHeader
        title={`${ticker} Insider Trading`}
        description="Form 4 purchases and sales reported by officers, directors, and 10% owners, plus quarterly FMP statistics."
      />
      {recent.length > 0 ? (
        <section className="mb-8">
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
                  <th className="num">Buy / Sell</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((row) => (
                  <tr key={`${row.year}-${row.quarter}`}>
                    <td>
                      {row.year} Q{row.quarter}
                    </td>
                    <td className="num">{formatInteger(row.acquiredTransactions)}</td>
                    <td className="num">{formatInteger(row.disposedTransactions)}</td>
                    <td className="num">{formatInteger(row.totalAcquired)}</td>
                    <td className="num">{formatInteger(row.totalDisposed)}</td>
                    <td className="num">{formatNumber(row.acquiredDisposedRatio)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}
      <InsiderTable rows={rows} showSymbol={false} empty={`No recent insider trades for ${ticker}.`} />
    </Container>
  );
}
