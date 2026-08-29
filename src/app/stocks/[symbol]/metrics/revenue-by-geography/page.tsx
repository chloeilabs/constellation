import { Container } from "@/components/container";
import { PageHeader, PeriodToggle, YearToggle } from "@/components/page-header";
import { SectionNav } from "@/components/section-nav";
import { StatementTable } from "@/components/statement-table";
import { getProfile, getRevenueGeographicSegments } from "@/lib/fmp";
import { reportingCurrency } from "@/lib/format";
import { decodeTicker, displayCompanyName, stockPath } from "@/lib/listings";
import { metricsNav } from "@/lib/nav";
import {
  orderedGeoNames,
  priorTtmSegmentMap,
  segmentStatementColumns,
  segmentStatementRows,
  spanFrom,
  statementHref,
  statementLimit,
  topSegmentNames,
  ttmSegmentMap,
} from "@/lib/statements";

export default async function RevenueByGeographyPage({
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
  const base = stockPath(ticker, "/metrics/revenue-by-geography");
  const [profile, geos, geoQuarters] = await Promise.all([
    getProfile(ticker),
    getRevenueGeographicSegments(ticker, "annual"),
    getRevenueGeographicSegments(ticker, "quarter"),
  ]);
  const geoTtm = ttmSegmentMap(geoQuarters);
  const geoPriorTtm = priorTtmSegmentMap(geoQuarters);
  const geoNames = orderedGeoNames(topSegmentNames(geos, geoTtm));
  const currency = reportingCurrency(geos[0]?.reportedCurrency, geoQuarters[0]?.reportedCurrency);
  const columns = segmentStatementColumns(
    period === "quarter" ? geoQuarters : geos,
    geoNames,
    period,
    period === "annual" ? geoTtm : null,
    displayCount,
    period === "annual" ? geoPriorTtm : null,
    geoQuarters[0]?.date,
  );
  const shortName = displayCompanyName(profile?.companyName) || ticker;

  return (
    <Container>
      <PageHeader
        title={`${shortName} Revenue by Geography`}
        description="Geographic revenue from company filings."
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
      {geoNames.length > 0 ? (
        <StatementTable
          rows={segmentStatementRows(geoNames, "Revenue (Total)", "Revenue")}
          columns={columns}
          scale="millions"
          currency={currency}
          caption={`Values in millions of ${currency}.`}
          downloadName={`${ticker}-revenue-by-geography-${period}-${span}`}
          inlineYoy={false}
        />
      ) : (
        <p className="text-sm text-muted">Geographic revenue segmentation is not available for {ticker}.</p>
      )}
    </Container>
  );
}
