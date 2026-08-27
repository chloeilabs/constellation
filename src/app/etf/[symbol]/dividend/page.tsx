import { Container } from "@/components/container";
import { PageHeader } from "@/components/page-header";
import { formatDate, formatPrice } from "@/lib/format";
import { getDividends } from "@/lib/fmp";

export default async function EtfDividendPage({ params }: { params: Promise<{ symbol: string }> }) {
  const { symbol } = await params;
  const ticker = symbol.toUpperCase();
  const dividends = await getDividends(ticker, 40);
  const latest = dividends[0];
  const ttm = dividends.slice(0, 4).reduce((sum, row) => sum + (row.dividend || 0), 0);

  return (
    <Container>
      <PageHeader title={`${ticker} Dividend`} description="Distribution history, yield, and payment dates." />
      <div className="grid gap-4 sm:grid-cols-4">
        <div className="rounded-lg border border-border p-4">
          <div className="text-sm text-muted">Last Distribution</div>
          <div className="mt-1 text-2xl font-semibold tabular">${formatPrice(latest?.dividend)}</div>
        </div>
        <div className="rounded-lg border border-border p-4">
          <div className="text-sm text-muted">TTM Distributions</div>
          <div className="mt-1 text-2xl font-semibold tabular">${formatPrice(ttm || null)}</div>
        </div>
        <div className="rounded-lg border border-border p-4">
          <div className="text-sm text-muted">Yield</div>
          <div className="mt-1 text-2xl font-semibold tabular">
            {latest?.yield != null ? `${Number(latest.yield).toFixed(2)}%` : "—"}
          </div>
        </div>
        <div className="rounded-lg border border-border p-4">
          <div className="text-sm text-muted">Frequency</div>
          <div className="mt-1 text-2xl font-semibold">{latest?.frequency ?? "—"}</div>
        </div>
      </div>
      <div className="mt-8 overflow-x-auto rounded-lg border border-border">
        <table className="sa-table">
          <thead>
            <tr>
              <th>Ex-Dividend</th>
              <th>Record</th>
              <th>Payment</th>
              <th className="num">Amount</th>
              <th className="num">Yield</th>
            </tr>
          </thead>
          <tbody>
            {dividends.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-muted">
                  No distribution history found.
                </td>
              </tr>
            ) : (
              dividends.map((row) => (
                <tr key={`${row.date}-${row.paymentDate}`}>
                  <td>{formatDate(row.date)}</td>
                  <td>{formatDate(row.recordDate)}</td>
                  <td>{formatDate(row.paymentDate)}</td>
                  <td className="num">${formatPrice(row.dividend)}</td>
                  <td className="num">{row.yield != null ? `${Number(row.yield).toFixed(2)}%` : "—"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </Container>
  );
}
