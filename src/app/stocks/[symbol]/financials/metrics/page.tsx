import Link from "next/link";
import { Container } from "@/components/container";
import { FinancialsNav } from "@/components/financials-nav";
import { PageHeader, PeriodToggle, YearToggle } from "@/components/page-header";
import { StatementTable } from "@/components/statement-table";
import { getRevenueGeographicSegments, getRevenueProductSegments } from "@/lib/fmp";
import { reportingCurrency } from "@/lib/format";
import { decodeTicker, stockPath } from "@/lib/listings";
import { loadLiveValuation, loadPeriodValuationHistory, periodValuationColumns } from "@/lib/period-valuation";
import {
  KEY_METRIC_ROWS,
  orderedGeoNames,
  orderedProductNames,
  priorTtmSegmentMap,
  productMetricRows,
  segmentStatementColumns,
  segmentStatementRows,
  spanFrom,
  statementHref,
  statementLimit,
  topSegmentNames,
  ttmSegmentMap,
  withStatementHrefs,
} from "@/lib/statements";
import type { StatementPeriod } from "@/lib/types";
import { nyDateString } from "@/lib/utils";

export default async function MetricsPage({
  params,
  searchParams,
}: {
  params: Promise<{ symbol: string }>;
  searchParams: Promise<{ period?: string; years?: string }>;
}) {
  const { symbol } = await params;
  const { period: periodParam, years: yearsParam } = await searchParams;
  const ticker = decodeTicker(symbol);
  const period: StatementPeriod = periodParam === "quarter" ? "quarter" : "annual";
  const span = spanFrom(yearsParam);
  const yearCount = statementLimit("annual", span);
  const quarterCount = statementLimit("quarter", span);
  const base = stockPath(ticker, "/financials/metrics");
  const [live, history, products, productQuarters, geos, geoQuarters] = await Promise.all([
    loadLiveValuation(ticker),
    loadPeriodValuationHistory(ticker, period, statementLimit(period, span)),
    getRevenueProductSegments(ticker, "annual"),
    getRevenueProductSegments(ticker, "quarter"),
    getRevenueGeographicSegments(ticker, "annual"),
    getRevenueGeographicSegments(ticker, "quarter"),
  ]);
  const currency = reportingCurrency(
    (history[0] as { reportedCurrency?: string } | undefined)?.reportedCurrency,
    products[0]?.reportedCurrency,
  );
  const productTtm = ttmSegmentMap(productQuarters);
  const productPriorTtm = priorTtmSegmentMap(productQuarters);
  const geoTtm = ttmSegmentMap(geoQuarters);
  const geoPriorTtm = priorTtmSegmentMap(geoQuarters);
  const productNames = orderedProductNames(topSegmentNames(products, productTtm));
  const geoNames = orderedGeoNames(topSegmentNames(geos, geoTtm));
  const productColumns = segmentStatementColumns(
    period === "quarter" ? productQuarters : products,
    productNames,
    period,
    period === "annual" ? productTtm : null,
    period === "quarter" ? quarterCount : yearCount,
    period === "annual" ? productPriorTtm : null,
    productQuarters[0]?.date,
    { productRollup: true },
  );
  const geoColumns = segmentStatementColumns(
    period === "quarter" ? geoQuarters : geos,
    geoNames,
    period,
    period === "annual" ? geoTtm : null,
    period === "quarter" ? quarterCount : yearCount,
    period === "annual" ? geoPriorTtm : null,
    geoQuarters[0]?.date,
  );
  const valuationColumns = [
    { key: "ttm", label: "TTM", values: { ...(live as Record<string, unknown>), date: nyDateString() } },
    ...periodValuationColumns(history, period),
  ];

  return (
    <Container>
      <PageHeader
        title={`${ticker} Business Metrics`}
        description="Product and geographic revenue from company filings. Products is the hardware total; Services is reported separately."
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
      <FinancialsNav symbol={ticker} />

      {productNames.length > 0 ? (
        <section className="mt-2">
          <div className="mb-3 flex items-end justify-between gap-3">
            <h2 className="text-lg font-semibold text-header">Revenue by Segment</h2>
            <Link href={stockPath(ticker, "/metrics/revenue-by-segment")} className="text-sm text-link hover:underline">
              Segment page
            </Link>
          </div>
          <StatementTable
            rows={productMetricRows(productNames)}
            columns={productColumns}
            scale="millions"
            currency={currency}
            caption={`Values in millions of ${currency}. Segment names follow the company's reported product lines.`}
            downloadName={`${ticker}-product-revenue-${period}-${span}`}
            inlineYoy={false}
          />
        </section>
      ) : (
        <p className="text-sm text-muted">Product revenue segmentation is not available for {ticker}.</p>
      )}

      {geoNames.length > 0 ? (
        <section className="mt-10">
          <div className="mb-3 flex items-end justify-between gap-3">
            <h2 className="text-lg font-semibold text-header">Revenue by Geography</h2>
            <Link href={stockPath(ticker, "/metrics/revenue-by-geography")} className="text-sm text-link hover:underline">
              Geography page
            </Link>
          </div>
          <StatementTable
            rows={segmentStatementRows(geoNames, "Revenue (Total)", "Revenue")}
            columns={geoColumns}
            scale="millions"
            currency={currency}
            caption={`Values in millions of ${currency}.`}
            downloadName={`${ticker}-geographic-revenue-${period}-${span}`}
            inlineYoy={false}
          />
        </section>
      ) : null}

      <section className="mt-10">
        <h2 className="mb-3 text-lg font-semibold text-header">Valuation & Efficiency</h2>
        <StatementTable
          rows={withStatementHrefs(KEY_METRIC_ROWS, ticker)}
          columns={valuationColumns}
          currency={currency}
          caption={`Amounts are shown in ${currency}. The TTM column uses trailing-twelve-month filings and the latest close.`}
          downloadName={`${ticker}-key-metrics-${period}-${span}`}
        />
      </section>
    </Container>
  );
}
