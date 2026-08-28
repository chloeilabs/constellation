import { Container } from "@/components/container";
import { PageHeader } from "@/components/page-header";
import { formatDate, formatPercentPlain, formatPrice } from "@/lib/format";
import {
  DISTRIBUTION_TTM_LIMIT,
  dividendTtmGrowth,
  dividendYieldFromPrice,
  trailingDividendWindow,
} from "@/lib/dividends";
import { getDividends, getQuote } from "@/lib/fmp";
import { decodeTicker } from "@/lib/listings";
import { nyDateString, payoutFrequencyLabel } from "@/lib/utils";

export async function VehicleDividend({ symbol }: { symbol: string }) {
  const ticker = decodeTicker(symbol);
  const [dividends, quote] = await Promise.all([
    getDividends(ticker, DISTRIBUTION_TTM_LIMIT),
    getQuote(ticker),
  ]);
  const latest = dividends[0];
  const asOf = nyDateString();
  const ttm = trailingDividendWindow(dividends, asOf);
  const ttmYield = dividendYieldFromPrice(ttm, quote?.price);
  const ttmGrowth = dividendTtmGrowth(dividends, asOf);

  return (
    <Container>
      <PageHeader title={`${ticker} Dividend`} description="Distribution history, yield, and payment dates." />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <div className="rounded-lg border border-border p-4">
          <div className="text-sm text-muted">Last Distribution</div>
          <div className="mt-1 text-2xl font-semibold tabular">${formatPrice(latest?.dividend)}</div>
        </div>
        <div className="rounded-lg border border-border p-4">
          <div className="text-sm text-muted">TTM Distributions</div>
          <div className="mt-1 text-2xl font-semibold tabular">${formatPrice(ttm)}</div>
        </div>
        <div className="rounded-lg border border-border p-4">
          <div className="text-sm text-muted">Yield</div>
          <div className="mt-1 text-2xl font-semibold tabular">
            {ttmYield != null
              ? formatPercentPlain(ttmYield)
              : latest?.yield != null
                ? formatPercentPlain(latest.yield, { alreadyPercent: true })
                : "—"}
          </div>
        </div>
        <div className="rounded-lg border border-border p-4">
          <div className="text-sm text-muted">Frequency</div>
          <div className="mt-1 text-2xl font-semibold">{payoutFrequencyLabel(latest?.frequency) ?? "—"}</div>
        </div>
        <div className="rounded-lg border border-border p-4">
          <div className="text-sm text-muted">Dividend Growth (1Y)</div>
          <div className="mt-1 text-2xl font-semibold tabular">{formatPercentPlain(ttmGrowth)}</div>
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
              dividends.map((row, index) => (
                <tr key={`${row.date}-${row.paymentDate}-${row.dividend}-${index}`}>
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
