import { Container } from "@/components/container";
import { PageHeader } from "@/components/page-header";
import { SectionNav } from "@/components/section-nav";
import { quoteFundamentalsNav } from "@/lib/nav";
import { MetricCards } from "@/components/metric-cards";
import { ChangePercent } from "@/components/change";
import { formatCompact, formatCompactMoney, formatDate, formatMoney, formatPercentPlain } from "@/lib/format";
import { getIncomeGrowth, getIncomeStatements, getProfile, getQuote, getShareFloat } from "@/lib/fmp";
import { decodeTicker } from "@/lib/listings";
import { relativeChange } from "@/lib/utils";

export default async function SharesPage({ params }: { params: Promise<{ symbol: string }> }) {
  const { symbol } = await params;
  const ticker = decodeTicker(symbol);
  const [quote, profile, shareFloat, annual, quarterly, growthRows] = await Promise.all([
    getQuote(ticker),
    getProfile(ticker),
    getShareFloat(ticker),
    getIncomeStatements(ticker, "annual", 2),
    getIncomeStatements(ticker, "quarter", 2),
    getIncomeGrowth(ticker, "annual", 1),
  ]);
  const outstanding =
    shareFloat?.outstandingShares ?? annual[0]?.weightedAverageShsOutDil ?? quote?.sharesOutstanding;
  const floatShares = shareFloat?.floatShares;
  const restricted =
    typeof outstanding === "number" && typeof floatShares === "number" ? outstanding - floatShares : null;
  const sharesYoy =
    (typeof growthRows[0]?.growthWeightedAverageShsOutDil === "number" ? growthRows[0].growthWeightedAverageShsOutDil : null) ??
    relativeChange(annual[0]?.weightedAverageShsOutDil, annual[1]?.weightedAverageShsOutDil);
  const sharesQoq = relativeChange(quarterly[0]?.weightedAverageShsOutDil, quarterly[1]?.weightedAverageShsOutDil);

  return (
    <Container>
      <PageHeader
        title={`${ticker} Shares Outstanding`}
        description="Shares outstanding, public float, and year-over-year share count from live FMP filings."
      />
      <SectionNav items={quoteFundamentalsNav(ticker)} />
      <MetricCards
        items={[
          { label: "Shares Outstanding", value: formatCompact(outstanding) },
          {
            label: "Shares Change (YoY)",
            value: sharesYoy == null ? "—" : <ChangePercent value={sharesYoy} alreadyPercent={false} className="text-2xl" />,
          },
          {
            label: "Shares Change (QoQ)",
            value: sharesQoq == null ? "—" : <ChangePercent value={sharesQoq} alreadyPercent={false} className="text-2xl" />,
          },
          { label: "Float", value: formatCompact(floatShares) },
          {
            label: "Free Float",
            value: formatPercentPlain(shareFloat?.freeFloat, { alreadyPercent: true }),
          },
          { label: "Restricted", value: formatCompact(restricted) },
          { label: "Market Cap", value: formatCompactMoney(quote?.marketCap, profile?.currency) },
          { label: "Stock Price", value: formatMoney(quote?.price, profile?.currency) },
        ]}
      />
      <p className="mt-4 text-sm text-muted">
        As of {formatDate(shareFloat?.date)}. Float is the shares available to trade; restricted shares are outstanding
        minus float. Share-count changes use diluted weighted-average shares from the income statement.
        {shareFloat?.source ? (
          <>
            {" "}
            <a href={shareFloat.source} className="text-link hover:underline" target="_blank" rel="noreferrer">
              Source filing
            </a>
          </>
        ) : null}
      </p>
    </Container>
  );
}
