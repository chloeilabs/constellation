import Link from "next/link";
import { Container } from "@/components/container";
import { HistoryBars } from "@/components/history-bars";
import { PageHeader } from "@/components/page-header";
import { formatDate, formatMoney, formatPercentPlain } from "@/lib/format";
import { getCashFlowTtm, getDividends, getIncomeStatements, getProfile, getQuote, getRatiosTtm } from "@/lib/fmp";
import { decodeTicker } from "@/lib/listings";
import { consecutiveDividendGrowthYears, dividendTtmGrowth, dividendsByFiscalYear } from "@/lib/dividends";
import { cashOutlay, indicatedAnnualDividend, nyDateString, relativeChange } from "@/lib/utils";
import { buybackYieldFromShareChange } from "@/lib/valuation";

export default async function DividendPage({ params }: { params: Promise<{ symbol: string }> }) {
  const { symbol } = await params;
  const ticker = decodeTicker(symbol);
  const [profile, dividends, quote, ratios, annual, cash] = await Promise.all([
    getProfile(ticker),
    getDividends(ticker, 80),
    getQuote(ticker),
    getRatiosTtm(ticker),
    getIncomeStatements(ticker, "annual", 20),
    getCashFlowTtm(ticker),
  ]);
  const latest = dividends[0];
  const annualized = indicatedAnnualDividend(latest, profile?.lastDividend);
  const price = quote?.price ?? profile?.price;
  const indicatedYield = annualized && price ? annualized / price : null;
  const ttmYield = typeof (ratios as Record<string, unknown> | null)?.dividendYieldTTM === "number"
    ? (ratios as { dividendYieldTTM: number }).dividendYieldTTM
    : indicatedYield;
  const payout =
    typeof (ratios as Record<string, unknown> | null)?.dividendPayoutRatioTTM === "number"
      ? (ratios as { dividendPayoutRatioTTM: number }).dividendPayoutRatioTTM
      : null;

  const ttmGrowth = dividendTtmGrowth(dividends);
  const byYear = dividendsByFiscalYear(dividends, annual);
  const years = [...byYear.keys()].sort();
  const lastCompleteFy = annual[0]?.fiscalYear != null ? String(annual[0].fiscalYear) : null;
  const complete = years.filter((year) => !lastCompleteFy || year <= lastCompleteFy);
  const bars = years.map((year) => ({ label: `FY ${year}`, value: byYear.get(year) ?? 0 }));
  const five = (complete.length >= 2 ? complete : years).slice(-6);
  const first = five[0] ? byYear.get(five[0]) : null;
  const last = five.at(-1) ? byYear.get(five.at(-1)!) : null;
  const span = five.length - 1;
  const cagr = first && last && first > 0 && span > 0 ? Math.pow(last / first, 1 / span) - 1 : null;
  const growthYears = consecutiveDividendGrowthYears(byYear, complete);
  const marketCap = quote?.marketCap ?? profile?.marketCap ?? null;
  const ttmBuybacks = cashOutlay(cash?.commonStockRepurchased);
  const sharesYoy = relativeChange(annual[0]?.weightedAverageShsOutDil, annual[1]?.weightedAverageShsOutDil);
  const cashBuybackYield = ttmBuybacks != null && marketCap ? ttmBuybacks / marketCap : null;
  const buybackYield = buybackYieldFromShareChange(sharesYoy) ?? cashBuybackYield;
  const shareholderYield =
    buybackYield != null || ttmYield != null ? (buybackYield ?? 0) + (ttmYield ?? 0) : null;
  const currency = profile?.currency || "USD";
  const px = (value: number | null | undefined) => formatMoney(value, currency);
  const today = nyDateString();
  const upcoming = [...dividends]
    .filter((row) => (row.date || "") >= today)
    .sort((a, b) => a.date.localeCompare(b.date));
  const nextEx = upcoming[0] ?? null;
  const nextPay =
    [...dividends]
      .filter((row) => (row.paymentDate || "") >= today)
      .sort((a, b) => a.paymentDate.localeCompare(b.paymentDate))[0] ?? null;

  return (
    <Container>
      <PageHeader
        title={`${ticker} Dividend`}
        description="Dividend history, yield, payout, and growth from live FMP data."
        actions={
          <div className="flex flex-wrap gap-2">
            <Link
              href={`/stocks/${ticker}/dividend-yield`}
              className="inline-flex items-center rounded-md border border-border-strong px-3 py-1.5 text-sm font-medium hover:bg-muted-bg"
            >
              Yield History
            </Link>
            <Link
              href={`/tools/dividend-calculator?symbol=${encodeURIComponent(ticker)}`}
              className="inline-flex items-center rounded-md border border-border-strong px-3 py-1.5 text-sm font-medium hover:bg-muted-bg"
            >
              Dividend Calculator
            </Link>
          </div>
        }
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {nextEx ? (
          <div className="rounded-lg border border-border p-4">
            <div className="text-sm text-muted">Next Ex-Dividend</div>
            <div className="mt-1 text-2xl font-semibold tabular">{formatDate(nextEx.date)}</div>
            <div className="mt-1 text-sm text-muted">{px(nextEx.dividend)}</div>
          </div>
        ) : null}
        {nextPay ? (
          <div className="rounded-lg border border-border p-4">
            <div className="text-sm text-muted">Next Payment</div>
            <div className="mt-1 text-2xl font-semibold tabular">{formatDate(nextPay.paymentDate)}</div>
            <div className="mt-1 text-sm text-muted">{px(nextPay.dividend)}</div>
          </div>
        ) : null}
        <div className="rounded-lg border border-border p-4">
          <div className="text-sm text-muted">Last Dividend</div>
          <div className="mt-1 text-2xl font-semibold tabular">{px(latest?.dividend ?? profile?.lastDividend)}</div>
        </div>
        <div className="rounded-lg border border-border p-4">
          <div className="text-sm text-muted">Annual Dividend</div>
          <div className="mt-1 text-2xl font-semibold tabular">{px(annualized)}</div>
        </div>
        <div className="rounded-lg border border-border p-4">
          <div className="text-sm text-muted">
            <Link href={`/stocks/${ticker}/dividend-yield`} className="text-link hover:underline">
              Indicated Yield
            </Link>
          </div>
          <div className="mt-1 text-2xl font-semibold tabular">{formatPercentPlain(indicatedYield)}</div>
        </div>
        <div className="rounded-lg border border-border p-4">
          <div className="text-sm text-muted">
            <Link href={`/stocks/${ticker}/dividend-yield`} className="text-link hover:underline">
              TTM Yield
            </Link>
          </div>
          <div className="mt-1 text-2xl font-semibold tabular">{formatPercentPlain(ttmYield)}</div>
        </div>
        <div className="rounded-lg border border-border p-4">
          <div className="text-sm text-muted">
            <Link href={`/stocks/${ticker}/payout-ratio`} className="text-link hover:underline">
              Payout Ratio
            </Link>
          </div>
          <div className="mt-1 text-2xl font-semibold tabular">{formatPercentPlain(payout)}</div>
        </div>
        <div className="rounded-lg border border-border p-4">
          <div className="text-sm text-muted">Frequency</div>
          <div className="mt-1 text-2xl font-semibold">{latest?.frequency ?? "—"}</div>
        </div>
        <div className="rounded-lg border border-border p-4">
          <div className="text-sm text-muted">Dividend Growth (1Y)</div>
          <div className="mt-1 text-2xl font-semibold tabular">{formatPercentPlain(ttmGrowth)}</div>
        </div>
        <div className="rounded-lg border border-border p-4">
          <div className="text-sm text-muted">5Y Dividend CAGR</div>
          <div className="mt-1 text-2xl font-semibold tabular">{formatPercentPlain(cagr)}</div>
        </div>
        <div className="rounded-lg border border-border p-4">
          <div className="text-sm text-muted">Years of Dividend Growth</div>
          <div className="mt-1 text-2xl font-semibold tabular">{growthYears > 0 ? growthYears : "—"}</div>
        </div>
        <div className="rounded-lg border border-border p-4">
          <div className="text-sm text-muted">
            <Link href={`/stocks/${ticker}/buybacks`} className="text-link hover:underline">
              Buyback Yield
            </Link>
          </div>
          <div className="mt-1 text-2xl font-semibold tabular">{formatPercentPlain(buybackYield)}</div>
        </div>
        <div className="rounded-lg border border-border p-4">
          <div className="text-sm text-muted">
            <Link href={`/stocks/${ticker}/buybacks`} className="text-link hover:underline">
              Shareholder Yield
            </Link>
          </div>
          <div className="mt-1 text-2xl font-semibold tabular">{formatPercentPlain(shareholderYield)}</div>
        </div>
      </div>
      {bars.length > 1 ? (
        <div className="mt-8">
          <h2 className="mb-3 text-lg font-semibold text-header">Annual Dividends Per Share (Fiscal Year)</h2>
          <HistoryBars items={bars} formatValue={(value) => px(value)} />
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
                  <td className="num">{px(row.dividend)}</td>
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
