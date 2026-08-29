import { Container } from "@/components/container";
import { PageHeader, PeriodToggle, YearToggle } from "@/components/page-header";
import { SectionNav } from "@/components/section-nav";
import { StatementTable } from "@/components/statement-table";
import { getProfile, getRevenueProductSegments } from "@/lib/fmp";
import { reportingCurrency } from "@/lib/format";
import { decodeTicker, displayCompanyName, stockPath } from "@/lib/listings";
import { metricsNav } from "@/lib/nav";
import {
  orderedProductNames,
  priorTtmSegmentMap,
  productMetricRows,
  segmentStatementColumns,
  spanFrom,
  statementHref,
  statementLimit,
  topSegmentNames,
  ttmSegmentMap,
} from "@/lib/statements";

export default async function RevenueBySegmentPage({
  params,
  searchParams,
}: {
  params: Promise<{ symbol: string }>;
  searchParams: Promise<{ period?: string; years?: string }>;
}) {
  const { symbol } = await params;
  const { period: periodParam, years: yearsParam } = await searchParams;
  const ticker = decodeTicker(symbol);
  const period = periodParam === "quarter" ? "quarter" : "annual";
  const span = spanFrom(yearsParam);
  const displayCount = statementLimit(period, span);
  const base = stockPath(ticker, "/metrics/revenue-by-segment");
  const [profile, products, productQuarters] = await Promise.all([
    getProfile(ticker),
    getRevenueProductSegments(ticker, "annual"),
    getRevenueProductSegments(ticker, "quarter"),
  ]);
  const productTtm = ttmSegmentMap(productQuarters);
  const productPriorTtm = priorTtmSegmentMap(productQuarters);
  const productNames = orderedProductNames(topSegmentNames(products, productTtm));
  const currency = reportingCurrency(products[0]?.reportedCurrency, productQuarters[0]?.reportedCurrency);
  const columns = segmentStatementColumns(
    period === "quarter" ? productQuarters : products,
    productNames,
    period,
    period === "annual" ? productTtm : null,
    displayCount,
    period === "annual" ? productPriorTtm : null,
    productQuarters[0]?.date,
    { productRollup: true },
  );
  const shortName = displayCompanyName(profile?.companyName) || ticker;

  return (
    <Container>
      <PageHeader
        title={`${shortName} Revenue by Segment`}
        description="Product-line revenue from company filings. Products is the hardware total; Services is reported separately."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <PeriodToggle
              period={period}
              annualHref={statementHref(base, "annual", "standardized", span)}
              quarterHref={statementHref(base, "quarter", "standardized", span)}
            />
            <YearToggle
              span={span}
              fiveHref={statementHref(base, period, "standardized", "5")}
              tenHref={statementHref(base, period, "standardized", "10")}
              maxHref={statementHref(base, period, "standardized", "max")}
            />
          </div>
        }
      />
      <SectionNav items={metricsNav(ticker)} />
      {productNames.length > 0 ? (
        <StatementTable
          rows={productMetricRows(productNames)}
          columns={columns}
          scale="millions"
          currency={currency}
          caption={`Values in millions of ${currency}.`}
          downloadName={`${ticker}-revenue-by-segment-${period}-${span}`}
          inlineYoy={false}
        />
      ) : (
        <p className="text-sm text-muted">Product revenue segmentation is not available for {ticker}.</p>
      )}
    </Container>
  );
}
