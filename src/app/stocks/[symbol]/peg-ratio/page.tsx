import { Container } from "@/components/container";
import { PageHeader } from "@/components/page-header";
import { SectionNav } from "@/components/section-nav";
import { quoteFundamentalsNav } from "@/lib/nav";
import { MetricCards } from "@/components/metric-cards";
import { MetricHistory } from "@/components/metric-history";
import { formatMoney, formatPercentPlain, formatRatio } from "@/lib/format";
import { getIncomeGrowth, getIncomeTtm, getProfile, getQuote, getRatios, getRatiosTtm } from "@/lib/fmp";
import { decodeTicker } from "@/lib/listings";

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
  const [annual, quarterly, ttmRatios, ttmIncome, quote, profile, growthRows] = await Promise.all([
    getRatios(ticker, "annual", 20),
    getRatios(ticker, "quarter", 12),
    getRatiosTtm(ticker),
    getIncomeTtm(ticker),
    getQuote(ticker),
    getProfile(ticker),
    getIncomeGrowth(ticker, "annual", 1),
  ]);
  const history = period === "quarter" ? quarterly : annual;
  const pe = num(ttmRatios?.priceToEarningsRatioTTM) ?? quote?.pe ?? null;
  const epsGrowth = num(growthRows[0]?.growthEPSDiluted) ?? num(growthRows[0]?.growthEPS);
  const reportedPeg = num(ttmRatios?.priceToEarningsGrowthRatioTTM) ?? num(ttmRatios?.priceToEarningsDilutedGrowthRatioTTM);
  const derivedPeg = pe != null && epsGrowth != null && epsGrowth > 0 ? pe / (epsGrowth * 100) : null;
  const peg = reportedPeg ?? derivedPeg;
  const currency = profile?.currency || "USD";
  const eps = ttmIncome?.epsDiluted ?? ttmIncome?.eps;

  return (
    <Container>
      <PageHeader
        title={`${ticker} PEG Ratio`}
        description="Price/earnings-to-growth from live FMP ratios, with a PE ÷ EPS-growth fallback when the reported PEG is missing."
      />
      <SectionNav items={quoteFundamentalsNav(ticker)} />
      <MetricCards
        items={[
          { label: "PEG Ratio (ttm)", value: formatRatio(peg) },
          { label: "Reported PEG", value: formatRatio(reportedPeg) },
          { label: "Derived PEG", value: formatRatio(derivedPeg) },
          { label: "PE Ratio (ttm)", value: formatRatio(pe) },
          { label: "EPS Growth", value: formatPercentPlain(epsGrowth) },
          { label: "Stock Price", value: formatMoney(quote?.price, currency) },
          { label: "EPS (ttm)", value: formatMoney(eps, currency) },
        ]}
      />
      <MetricHistory
        period={period}
        annualHref={`/stocks/${ticker}/peg-ratio`}
        quarterHref={`/stocks/${ticker}/peg-ratio?period=quarter`}
        title={`${period === "quarter" ? "Quarterly" : "Annual"} PEG Ratio`}
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
        PEG is PE divided by expected or trailing earnings growth. FMP reports{" "}
        <span className="text-header">priceToEarningsGrowthRatio</span>
        {" "}on ratio statements. When that field is empty, this page uses{" "}
        <span className="text-header">PEG = PE ÷ (EPS growth × 100)</span> with annual diluted EPS growth.
      </p>
    </Container>
  );
}
