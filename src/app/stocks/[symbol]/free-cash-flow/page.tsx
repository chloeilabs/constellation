import { Container } from "@/components/container";
import { PageHeader } from "@/components/page-header";
import { SectionNav } from "@/components/section-nav";
import { quoteFundamentalsNav } from "@/lib/nav";
import { MetricCards } from "@/components/metric-cards";
import { MetricHistory } from "@/components/metric-history";
import { ChangePercent } from "@/components/change";
import { formatCompactUsd, yearOverYear } from "@/lib/format";
import { getCashFlows, getCashFlowTtm, getQuote, getRatiosTtm } from "@/lib/fmp";

export default async function FreeCashFlowPage({
  params,
  searchParams,
}: {
  params: Promise<{ symbol: string }>;
  searchParams: Promise<{ period?: string }>;
}) {
  const { symbol } = await params;
  const { period: periodParam } = await searchParams;
  const ticker = symbol.toUpperCase();
  const period = periodParam === "quarter" ? "quarter" : "annual";
  const [annual, quarterly, ttm, ratios, quote] = await Promise.all([
    getCashFlows(ticker, "annual", 20),
    getCashFlows(ticker, "quarter", 12),
    getCashFlowTtm(ticker),
    getRatiosTtm(ticker),
    getQuote(ticker),
  ]);
  const history = period === "quarter" ? quarterly : annual;
  const growth = yearOverYear(annual[0]?.freeCashFlow, annual[1]?.freeCashFlow);
  const fcfYield =
    ttm?.freeCashFlow && quote?.marketCap ? ttm.freeCashFlow / quote.marketCap : null;

  return (
    <Container>
      <PageHeader
        title={`${ticker} Free Cash Flow`}
        description="Operating cash flow minus capital expenditure, from company cash flow statements."
      />
      <SectionNav items={quoteFundamentalsNav(ticker)} />
      <MetricCards
        items={[
          { label: "FCF (ttm)", value: formatCompactUsd(ttm?.freeCashFlow) },
          { label: "Operating CF (ttm)", value: formatCompactUsd(ttm?.operatingCashFlow) },
          { label: "Capex (ttm)", value: formatCompactUsd(ttm?.capitalExpenditure) },
          {
            label: "FY Growth",
            value: growth == null ? "—" : <ChangePercent value={growth} alreadyPercent={false} className="text-2xl" />,
          },
          {
            label: "FCF Yield",
            value: fcfYield == null ? "—" : `${(fcfYield * 100).toFixed(2)}%`,
          },
          {
            label: "P/FCF",
            value:
              typeof ratios?.priceToFreeCashFlowRatioTTM === "number"
                ? ratios.priceToFreeCashFlowRatioTTM.toFixed(2)
                : "—",
          },
        ]}
      />
      <MetricHistory
        period={period}
        annualHref={`/stocks/${ticker}/free-cash-flow`}
        quarterHref={`/stocks/${ticker}/free-cash-flow?period=quarter`}
        title={`${period === "quarter" ? "Quarterly" : "Annual"} Free Cash Flow`}
        valueLabel="Free Cash Flow"
        formatValue={formatCompactUsd}
        empty="No free cash flow history available."
        rows={history.map((row) => ({
          key: `${row.date}-${row.period}`,
          date: row.date,
          label: period === "quarter" ? `${row.period} ${row.fiscalYear}` : String(row.fiscalYear),
          value: row.freeCashFlow,
        }))}
      />
    </Container>
  );
}
