import Link from "next/link";
import { Container } from "@/components/container";
import { HistoryBars } from "@/components/history-bars";
import { PageHeader } from "@/components/page-header";
import { formatDate, formatMoney, formatPercentPlain } from "@/lib/format";
import { getCashFlowTtm, getDividends, getIncomeStatements, getIncomeTtm, getProfile, getQuote } from "@/lib/fmp";
import { DividendHistoryTable } from "@/components/dividend-history-table";
import { decodeTicker, displayCompanyName, stockPath } from "@/lib/listings";
import {
  consecutiveDividendGrowthYears,
  DISTRIBUTION_HISTORY_LIMIT,
  dividendTtmGrowth,
  dividendYieldFromPrice,
  dividendsByFiscalYear,
  payoutRatioFromDps,
  trailingDividendWindow,
} from "@/lib/dividends";
import { ANNUAL_FILING_LIMIT } from "@/lib/statements";
import { pageNumber, paginate } from "@/lib/paging";
import { cashOutlay, indicatedAnnualDividend, nyDateString, payoutFrequencyLabel, payoutFrequencyProse, relativeChange } from "@/lib/utils";
import { buybackYieldFromShareChange } from "@/lib/valuation";

export default async function DividendPage({
  params,
  searchParams,
}: {
  params: Promise<{ symbol: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { symbol } = await params;
  const { page: pageParam } = await searchParams;
  const ticker = decodeTicker(symbol);
  const [profile, dividends, quote, annual, cash, ttm] = await Promise.all([
    getProfile(ticker),
    getDividends(ticker, DISTRIBUTION_HISTORY_LIMIT),
    getQuote(ticker),
    getIncomeStatements(ticker, "annual", ANNUAL_FILING_LIMIT),
    getCashFlowTtm(ticker),
    getIncomeTtm(ticker),
  ]);
  const latest = dividends[0];
  const annualized = indicatedAnnualDividend(latest, profile?.lastDividend);
  const price = quote?.price ?? profile?.price;
  const today = nyDateString();
  const indicatedYield = annualized && price ? annualized / price : null;
  const ttmYield = dividendYieldFromPrice(trailingDividendWindow(dividends, today), price);
  const payout = payoutRatioFromDps(annualized, ttm?.epsDiluted ?? ttm?.eps);

  const ttmGrowth = dividendTtmGrowth(dividends);
  const byYear = dividendsByFiscalYear(dividends, annual);
  const years = [...byYear.keys()].sort();
  const lastCompleteFy = annual[0]?.fiscalYear != null ? String(annual[0].fiscalYear) : null;
  const complete = years.filter((year) => !lastCompleteFy || year <= lastCompleteFy);
  const bars = complete.map((year) => ({ label: `FY ${year}`, value: byYear.get(year) ?? 0 }));
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
    buybackYield != null || indicatedYield != null ? (buybackYield ?? 0) + (indicatedYield ?? 0) : null;
  const currency = profile?.currency || "USD";
  const px = (value: number | null | undefined) => formatMoney(value, currency);
  const payments = paginate(dividends, pageNumber(pageParam));
  const upcoming = [...dividends]
    .filter((row) => (row.date || "") >= today)
    .sort((a, b) => a.date.localeCompare(b.date));
  const nextEx = upcoming[0] ?? null;
  const nextPay =
    [...dividends]
      .filter((row) => (row.paymentDate || "") >= today)
      .sort((a, b) => a.paymentDate.localeCompare(b.paymentDate))[0] ?? null;
  const lastEx = dividends.find((row) => row.date && row.date <= today) ?? latest;
  const shortName = displayCompanyName(profile?.companyName) || ticker;
  const cadence = payoutFrequencyProse(latest?.frequency);
  const dividendIntro = annualized
    ? `${shortName} has an annual dividend of ${px(annualized)} per share${
        indicatedYield != null ? `, with a yield of ${formatPercentPlain(indicatedYield)}` : ""
      }.${
        cadence && lastEx?.date
          ? ` The dividend is paid ${cadence} and the last ex-dividend date was ${formatDate(lastEx.date)}.`
          : lastEx?.date
            ? ` The last ex-dividend date was ${formatDate(lastEx.date)}.`
            : ""
      }`
    : "Dividend history, yield, payout, and growth from live FMP data.";

  return (
    <Container>
      <PageHeader
        title={`${shortName} Dividend`}
        description={dividendIntro}
        actions={
          <div className="flex flex-wrap gap-2">
            <Link
              href={`/stocks/${ticker}/dividend-yield`}
              className="sa-btn sa-btn-secondary"
            >
              Yield History
            </Link>
            <Link
              href={`/tools/dividend-calculator?symbol=${encodeURIComponent(ticker)}`}
              className="sa-btn sa-btn-secondary"
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
          <div className="text-sm text-muted">
            <Link href={`/stocks/${ticker}/dividend-yield`} className="text-link hover:underline">
              Dividend Yield
            </Link>
          </div>
          <div className="mt-1 text-2xl font-semibold tabular">{formatPercentPlain(indicatedYield)}</div>
        </div>
        <div className="rounded-lg border border-border p-4">
          <div className="text-sm text-muted">Annual Dividend</div>
          <div className="mt-1 text-2xl font-semibold tabular">{px(annualized)}</div>
        </div>
        <div className="rounded-lg border border-border p-4">
          <div className="text-sm text-muted">Ex-Dividend Date</div>
          <div className="mt-1 text-2xl font-semibold tabular">{formatDate(lastEx?.date)}</div>
        </div>
        <div className="rounded-lg border border-border p-4">
          <div className="text-sm text-muted">Payout Frequency</div>
          <div className="mt-1 text-2xl font-semibold">{payoutFrequencyLabel(latest?.frequency) ?? "—"}</div>
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
          <div className="text-sm text-muted">Dividend Growth (1Y)</div>
          <div className="mt-1 text-2xl font-semibold tabular">{formatPercentPlain(ttmGrowth)}</div>
        </div>
        <div className="rounded-lg border border-border p-4">
          <div className="text-sm text-muted">Growth Years</div>
          <div className="mt-1 text-2xl font-semibold tabular">{growthYears > 0 ? growthYears : "—"}</div>
        </div>
        <div className="rounded-lg border border-border p-4">
          <div className="text-sm text-muted">Last Dividend</div>
          <div className="mt-1 text-2xl font-semibold tabular">{px(latest?.dividend ?? profile?.lastDividend)}</div>
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
          <div className="text-sm text-muted">5Y Dividend CAGR</div>
          <div className="mt-1 text-2xl font-semibold tabular">{formatPercentPlain(cagr)}</div>
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
          <p className="mb-3 text-sm text-muted">
            Complete fiscal years only. The current year is omitted until the fiscal year ends.
          </p>
          <HistoryBars items={bars} formatValue={(value) => px(value)} />
        </div>
      ) : null}
      <DividendHistoryTable
        rows={payments.rows}
        from={payments.from}
        to={payments.to}
        total={payments.total}
        page={payments.page}
        pageCount={payments.pageCount}
        path={stockPath(ticker, "/dividend")}
        formatAmount={px}
      />
    </Container>
  );
}
