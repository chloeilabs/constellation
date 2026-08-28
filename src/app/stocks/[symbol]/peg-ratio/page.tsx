import { Container } from "@/components/container";
import { PageHeader } from "@/components/page-header";
import { SectionNav } from "@/components/section-nav";
import { quoteFundamentalsNav } from "@/lib/nav";
import { MetricCards } from "@/components/metric-cards";
import { MetricHistory } from "@/components/metric-history";
import { formatMoney, formatPercentPlain, formatRatio } from "@/lib/format";
import { getEstimates, getIncomeStatements, getIncomeTtm, getProfile, getQuote, getRatios, getRatiosTtm } from "@/lib/fmp";
import { decodeTicker } from "@/lib/listings";
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
  const [annualRatios, quarterlyRatios, ttmRatios, ttmIncome, quote, profile, estimates, annualIncome] = await Promise.all([
    getRatios(ticker, "annual", 20),
    getRatios(ticker, "quarter", 12),
    getRatiosTtm(ticker),
    getIncomeTtm(ticker),
    getQuote(ticker),
    getProfile(ticker),
    getEstimates(ticker, "annual"),
    getIncomeStatements(ticker, "annual", 1),
  ]);
  const history = period === "quarter" ? quarterlyRatios : annualRatios;
  const eps = ttmIncome?.epsDiluted ?? ttmIncome?.eps;
  const pe = trailingPe(quote?.price, eps) ?? num(ttmRatios?.priceToEarningsRatioTTM) ?? quote?.pe ?? null;
  const lastAnnual = annualIncome[0];
  const epsCagr =
    actualToEstimateCagr(lastAnnual?.epsDiluted ?? lastAnnual?.eps, lastAnnual?.date, estimates, "epsAvg", 3) ??
    estimateCagr(estimates, "epsAvg", 3);
  const reportedPeg = num(ttmRatios?.priceToEarningsGrowthRatioTTM) ?? num(ttmRatios?.priceToEarningsDilutedGrowthRatioTTM);
  const forwardPeg = pegRatio(pe, epsCagr);
  const peg = forwardPeg ?? reportedPeg;
  const currency = profile?.currency || "USD";

  return (
    <Container>
      <PageHeader
        title={`${ticker} PEG Ratio`}
        description="Price/earnings divided by the 3-year consensus EPS CAGR from live FMP estimates."
      />
      <SectionNav items={quoteFundamentalsNav(ticker)} />
      <MetricCards
        items={[
          { label: "PEG Ratio", value: formatRatio(peg) },
          { label: "Forward PEG", value: formatRatio(forwardPeg) },
          { label: "FMP Trailing PEG", value: formatRatio(reportedPeg) },
          { label: "PE Ratio (ttm)", value: formatRatio(pe) },
          { label: "EPS Growth Forecast (3Y)", value: formatPercentPlain(epsCagr) },
          { label: "Stock Price", value: formatMoney(quote?.price, currency) },
          { label: "EPS (ttm)", value: formatMoney(eps, currency) },
        ]}
      />
      <MetricHistory
        period={period}
        annualHref={`/stocks/${ticker}/peg-ratio`}
        quarterHref={`/stocks/${ticker}/peg-ratio?period=quarter`}
        title={`${period === "quarter" ? "Quarterly" : "Annual"} FMP PEG Ratio`}
        valueLabel="PEG Ratio"
        formatValue={formatRatio}
        empty="No PEG ratio history available."
        rows={history.map((row) => ({
          key: `${row.date}-${row.period}`,
          date: row.date,
          label: period === "quarter" ? `${row.period} ${row.fiscalYear}` : String(row.fiscalYear),
          value: num(row.priceToEarningsGrowthRatio) ?? num(row.priceToEarningsDilutedGrowthRatio),
        }))}
      />
      <p className="mt-4 text-sm text-muted">
        Headline PEG uses <span className="text-header">PEG = PE ÷ (3-year EPS CAGR × 100)</span>, where PE is price
        divided by trailing diluted EPS and growth is the CAGR from the last reported fiscal year to the matching FMP
        consensus estimate three years later. FMP&apos;s trailing PEG (often based on last-year EPS growth) is shown
        separately and used for the history table.
      </p>
    </Container>
  );
}
