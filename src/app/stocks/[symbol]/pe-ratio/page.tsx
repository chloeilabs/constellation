import { Container } from "@/components/container";
import { PageHeader } from "@/components/page-header";
import { SectionNav } from "@/components/section-nav";
import { quoteFundamentalsNav } from "@/lib/nav";
import { MetricCards } from "@/components/metric-cards";
import { MetricHistory } from "@/components/metric-history";
import { ChangePercent } from "@/components/change";
import { formatMoney, formatRatio } from "@/lib/format";
import { getEstimates, getIncomeTtm, getProfile, getQuote, getRatios, getRatiosTtm } from "@/lib/fmp";
import { industryHref, sectorHref, sectorIndustryPe } from "@/lib/industries";
import { forwardPe as forwardPeFromEstimates } from "@/lib/valuation";
import { decodeTicker, stockPath } from "@/lib/listings";

function num(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

export default async function PeRatioPage({
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
  const base = stockPath(ticker, "/pe-ratio");
  const [annual, quarterly, ttmRatios, ttmIncome, quote, estimates, profile] = await Promise.all([
    getRatios(ticker, "annual", 20),
    getRatios(ticker, "quarter", 12),
    getRatiosTtm(ticker),
    getIncomeTtm(ticker),
    getQuote(ticker),
    getEstimates(ticker, "annual"),
    getProfile(ticker),
  ]);
  const { sectorPe, industryPe } = await sectorIndustryPe(profile?.sector, profile?.industry);
  const history = period === "quarter" ? quarterly : annual;
  const pe = num(ttmRatios?.priceToEarningsRatioTTM);
  const eps = ttmIncome?.epsDiluted ?? ttmIncome?.eps;
  const impliedPe = quote?.price && eps ? quote.price / eps : null;
  const peValue = pe ?? impliedPe;
  const sectorPeVs = peValue != null && sectorPe ? peValue / sectorPe - 1 : null;
  const industryPeVs = peValue != null && industryPe ? peValue / industryPe - 1 : null;
  const currency = profile?.currency || "USD";

  return (
    <Container>
      <PageHeader
        title={`${ticker} PE Ratio`}
        description="Price-to-earnings versus the live FMP sector and industry snapshots, plus annual and quarterly history."
      />
      <SectionNav items={quoteFundamentalsNav(ticker)} />
      <MetricCards
        items={[
          { label: "PE Ratio (ttm)", value: formatRatio(peValue) },
          { label: "Forward PE", href: stockPath(ticker, "/forward-pe"), value: formatRatio(forwardPeFromEstimates(quote?.price, estimates)) },
          {
            label: "Sector PE",
            href: profile?.sector ? sectorHref(profile.sector) : undefined,
            value: formatRatio(sectorPe),
            hint: profile?.sector ?? undefined,
          },
          {
            label: "Industry PE",
            href: profile?.industry ? industryHref(profile.industry) : undefined,
            value: formatRatio(industryPe),
            hint: profile?.industry ?? undefined,
          },
          {
            label: "vs. Sector",
            value: sectorPeVs == null ? "—" : <ChangePercent value={sectorPeVs} alreadyPercent={false} className="text-2xl" />,
            hint: sectorPeVs == null ? undefined : sectorPeVs >= 0 ? "Premium to sector" : "Discount to sector",
          },
          {
            label: "vs. Industry",
            value: industryPeVs == null ? "—" : <ChangePercent value={industryPeVs} alreadyPercent={false} className="text-2xl" />,
            hint: industryPeVs == null ? undefined : industryPeVs >= 0 ? "Premium to industry" : "Discount to industry",
          },
          { label: "Stock Price", value: formatMoney(quote?.price, currency) },
          { label: "EPS (ttm)", value: formatMoney(eps, currency) },
        ]}
      />
      <MetricHistory
        period={period}
        annualHref={base}
        quarterHref={`${base}?period=quarter`}
        title={`${period === "quarter" ? "Quarterly" : "Annual"} PE Ratio`}
        valueLabel="PE Ratio"
        formatValue={formatRatio}
        empty="No PE ratio history available."
        rows={history.map((row) => ({
          key: `${row.date}-${row.period}`,
          date: row.date,
          label: period === "quarter" ? `${row.period} ${row.fiscalYear}` : String(row.fiscalYear),
          value: num(row.priceToEarningsRatio),
        }))}
      />
      <p className="mt-4 text-sm text-muted">
        PE is share price divided by trailing earnings per share.{" "}
        <span className="text-header">Formula: PE = Price ÷ EPS</span>
        {profile?.sector || profile?.industry
          ? " Sector and industry PE use the latest U.S. exchange snapshot from Financial Modeling Prep."
          : ""}
      </p>
    </Container>
  );
}
