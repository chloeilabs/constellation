import { Container } from "@/components/container";
import { HistoryBars } from "@/components/history-bars";
import { PageHeader } from "@/components/page-header";
import { formatDate, formatPercentPlain, formatPrice } from "@/lib/format";
import { getDividends, getProfile, getQuote, getRatiosTtm } from "@/lib/fmp";
import { annualDividendPayments, nyDateString } from "@/lib/utils";

export default async function DividendPage({ params }: { params: Promise<{ symbol: string }> }) {
  const { symbol } = await params;
  const ticker = symbol.toUpperCase();
  const [profile, dividends, quote, ratios] = await Promise.all([
    getProfile(ticker),
    getDividends(ticker, 60),
    getQuote(ticker),
    getRatiosTtm(ticker),
  ]);
  const latest = dividends[0];
  const payments = annualDividendPayments(latest?.frequency);
  const annualized =
    latest?.dividend && payments ? latest.dividend * payments : latest?.frequency?.toLowerCase().includes("quarter") ? (latest?.dividend ?? 0) * 4 : latest?.dividend;
  const price = quote?.price ?? profile?.price;
  const indicatedYield = annualized && price ? annualized / price : null;
  const ttmYield = typeof (ratios as Record<string, unknown> | null)?.dividendYieldTTM === "number"
    ? (ratios as { dividendYieldTTM: number }).dividendYieldTTM
    : indicatedYield;
  const payout =
    typeof (ratios as Record<string, unknown> | null)?.dividendPayoutRatioTTM === "number"
      ? (ratios as { dividendPayoutRatioTTM: number }).dividendPayoutRatioTTM
      : null;

  const byYear = new Map<string, number>();
  for (const row of dividends) {
    const year = String(row.date).slice(0, 4);
    const amount = row.adjDividend || row.dividend || 0;
    byYear.set(year, (byYear.get(year) ?? 0) + amount);
  }
  const years = [...byYear.keys()].sort();
  const completeYears = years.filter((year) => year < nyDateString().slice(0, 4));
  const bars = years.map((year) => ({ label: year, value: byYear.get(year) ?? 0 }));
  const five = (completeYears.length >= 2 ? completeYears : years).slice(-6);
  const first = five[0] ? byYear.get(five[0]) : null;
  const last = five.at(-1) ? byYear.get(five.at(-1)!) : null;
  const span = five.length - 1;
  const cagr = first && last && first > 0 && span > 0 ? Math.pow(last / first, 1 / span) - 1 : null;

  return (
    <Container>
      <PageHeader title={`${ticker} Dividend`} description="Dividend history, yield, payout, and growth from live FMP data." />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-lg border border-border p-4">
          <div className="text-sm text-muted">Last Dividend</div>
          <div className="mt-1 text-2xl font-semibold tabular">${formatPrice(latest?.dividend ?? profile?.lastDividend)}</div>
        </div>
        <div className="rounded-lg border border-border p-4">
          <div className="text-sm text-muted">Indicated Yield</div>
          <div className="mt-1 text-2xl font-semibold tabular">{formatPercentPlain(indicatedYield)}</div>
        </div>
        <div className="rounded-lg border border-border p-4">
          <div className="text-sm text-muted">TTM Yield</div>
          <div className="mt-1 text-2xl font-semibold tabular">{formatPercentPlain(ttmYield)}</div>
        </div>
        <div className="rounded-lg border border-border p-4">
          <div className="text-sm text-muted">Payout Ratio</div>
          <div className="mt-1 text-2xl font-semibold tabular">{formatPercentPlain(payout)}</div>
        </div>
        <div className="rounded-lg border border-border p-4">
          <div className="text-sm text-muted">Frequency</div>
          <div className="mt-1 text-2xl font-semibold">{latest?.frequency ?? "—"}</div>
        </div>
        <div className="rounded-lg border border-border p-4">
          <div className="text-sm text-muted">5Y Dividend CAGR</div>
          <div className="mt-1 text-2xl font-semibold tabular">{formatPercentPlain(cagr)}</div>
        </div>
      </div>
      {bars.length > 1 ? (
        <div className="mt-8">
          <h2 className="mb-3 text-lg font-semibold text-header">Annual Dividends Per Share</h2>
          <HistoryBars items={bars} formatValue={(value) => `$${formatPrice(value)}`} />
        </div>
      ) : null}
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
