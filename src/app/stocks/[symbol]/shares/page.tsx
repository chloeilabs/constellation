import { Container } from "@/components/container";
import { PageHeader } from "@/components/page-header";
import { SectionNav } from "@/components/section-nav";
import { quoteFundamentalsNav } from "@/lib/nav";
import { MetricCards } from "@/components/metric-cards";
import { formatCompact, formatCompactMoney, formatDate, formatMoney, formatPercentPlain } from "@/lib/format";
import { getProfile, getQuote, getShareFloat } from "@/lib/fmp";

export default async function SharesPage({ params }: { params: Promise<{ symbol: string }> }) {
  const { symbol } = await params;
  const ticker = symbol.toUpperCase();
  const [quote, profile, shareFloat] = await Promise.all([getQuote(ticker), getProfile(ticker), getShareFloat(ticker)]);
  const outstanding = shareFloat?.outstandingShares;
  const floatShares = shareFloat?.floatShares;
  const restricted =
    typeof outstanding === "number" && typeof floatShares === "number" ? outstanding - floatShares : null;

  return (
    <Container>
      <PageHeader
        title={`${ticker} Shares Outstanding`}
        description="Shares outstanding, public float, and free-float percentage from FMP share-float data."
      />
      <SectionNav items={quoteFundamentalsNav(ticker)} />
      <MetricCards
        items={[
          { label: "Shares Outstanding", value: formatCompact(outstanding) },
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
        minus float.{" "}
        {shareFloat?.source ? (
          <a href={shareFloat.source} className="text-link hover:underline" target="_blank" rel="noreferrer">
            Source filing
          </a>
        ) : null}
      </p>
    </Container>
  );
}
