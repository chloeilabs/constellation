import { Container } from "@/components/container";
import { PageHeader } from "@/components/page-header";
import { formatDate, formatPrice } from "@/lib/format";
import { getDividends, getProfile } from "@/lib/fmp";

export default async function DividendPage({ params }: { params: Promise<{ symbol: string }> }) {
  const { symbol } = await params;
  const ticker = symbol.toUpperCase();
  const [profile, dividends] = await Promise.all([getProfile(ticker), getDividends(ticker, 40)]);
  const latest = dividends[0];
  const annual = latest?.frequency?.toLowerCase().includes("quarter")
    ? (latest?.dividend ?? 0) * 4
    : latest?.dividend;

  return (
    <Container>
      <PageHeader title={`${ticker} Dividend`} description="Dividend history, yield, and payment dates." />
      <div className="grid gap-4 sm:grid-cols-4">
        <div className="rounded-lg border border-border p-4">
          <div className="text-sm text-muted">Last Dividend</div>
          <div className="mt-1 text-2xl font-semibold tabular">${formatPrice(latest?.dividend ?? profile?.lastDividend)}</div>
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
        <div className="rounded-lg border border-border p-4">
          <div className="text-sm text-muted">Annualized</div>
          <div className="mt-1 text-2xl font-semibold tabular">${formatPrice(annual)}</div>
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
                  No dividend history found.
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
