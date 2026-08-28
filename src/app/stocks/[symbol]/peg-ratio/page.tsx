import { Container } from "@/components/container";
import { PageHeader } from "@/components/page-header";
import { SectionNav } from "@/components/section-nav";
import { quoteFundamentalsNav } from "@/lib/nav";
import { MetricCards } from "@/components/metric-cards";
import { MetricHistory } from "@/components/metric-history";
import { formatMoney, formatPercentPlain, formatRatio, yearOverYear } from "@/lib/format";
import { getEstimates, getIncomeStatements, getIncomeTtm, getProfile, getQuote } from "@/lib/fmp";
import { decodeTicker, stockPath } from "@/lib/listings";
import { filingLimit } from "@/lib/statements";
import { historyLabel, loadPeriodValuationHistory } from "@/lib/period-valuation";
import { actualToEstimateCagr, estimateCagr, pegRatio, trailingPe } from "@/lib/valuation";

function num(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

export default async function PegRatioPage({
  params,
  searchParams,
}: {
  params: Promise<{ symbol: string }>;
  searchParams: Promise<{ period?: string }>;
}) {
  const { symbol } = await params;
  const { period: periodParam } = await searchParams;
  const ticker = decodeTicker(symbol);
  const period = periodParam === "quarter" ? "quarter" : "annual";
  const path = stockPath(ticker, "/peg-ratio");
  const [history, ttmIncome, quote, profile, estimates, annualIncome] = await Promise.all([
    loadPeriodValuationHistory(ticker, period, filingLimit(period)),
    getIncomeTtm(ticker),
    getQuote(ticker),
    getProfile(ticker),
    getEstimates(ticker, "annual"),
    getIncomeStatements(ticker, "annual", 2),
  ]);
  const eps = ttmIncome?.epsDiluted ?? ttmIncome?.eps;
  const pe = trailingPe(quote?.price, eps) ?? quote?.pe ?? null;
  const lastAnnual = annualIncome[0];
  const priorAnnual = annualIncome[1];
  const epsCagr =
    actualToEstimateCagr(lastAnnual?.epsDiluted ?? lastAnnual?.eps, lastAnnual?.date, estimates, "epsAvg", 3) ??
    estimateCagr(estimates, "epsAvg", 3);
  const trailingGrowth = yearOverYear(
    lastAnnual?.epsDiluted ?? lastAnnual?.eps,
    priorAnnual?.epsDiluted ?? priorAnnual?.eps,
  );
  const forwardPeg = pegRatio(pe, epsCagr);
  const trailingPeg = pegRatio(pe, trailingGrowth);
  const peg = forwardPeg ?? trailingPeg;
  const currency = profile?.currency || "USD";

  return (
    <Container>
      <PageHeader
        title={`${ticker} PEG Ratio`}
        description="Headline PEG is trailing PE divided by the 3-year consensus EPS CAGR. History is period-end PE divided by year-over-year EPS growth."
      />
      <SectionNav items={quoteFundamentalsNav(ticker)} />
      <MetricCards
        items={[
          { label: "PEG Ratio", value: formatRatio(peg) },
          { label: "Forward PEG", value: formatRatio(forwardPeg) },
          { label: "Trailing PEG", value: formatRatio(trailingPeg) },
          { label: "PE Ratio (ttm)", href: stockPath(ticker, "/pe-ratio"), value: formatRatio(pe) },
          { label: "EPS Growth Forecast (3Y)", value: formatPercentPlain(epsCagr) },
          { label: "Last FY EPS Growth", value: formatPercentPlain(trailingGrowth) },
          { label: "Stock Price", value: formatMoney(quote?.price, currency) },
          { label: "EPS (ttm)", value: formatMoney(eps, currency) },
        ]}
      />
      <MetricHistory
        period={period}
        annualHref={path}
        quarterHref={`${path}?period=quarter`}
        title={`${period === "quarter" ? "Quarterly" : "Annual"} PEG Ratio`}
        valueLabel="PEG Ratio"
        formatValue={formatRatio}
        empty="No PEG ratio history available."
        rows={history.map((row) => ({
          key: `${row.date}-${row.period}`,
          date: row.date,
          label: historyLabel(row, period),
          value: num(row.priceToEarningsGrowthRatio),
        }))}
      />
      <p className="mt-4 text-sm text-muted">
        Headline PEG uses <span className="text-header">PEG = PE ÷ (3-year EPS CAGR × 100)</span>, where PE is price
        divided by trailing diluted EPS and growth is the CAGR from the last reported fiscal year to the matching FMP
        consensus estimate three years later. Fiscal history uses period-end close PE divided by year-over-year EPS
        growth (year-ago quarter when viewing quarterly). FMP&apos;s trailing PEG is shown separately and is not used
        for history.
      </p>
    </Container>
  );
}
