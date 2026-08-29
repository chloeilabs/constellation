import Link from "next/link";
import { Container } from "@/components/container";
import { PageHeader, PeriodToggle } from "@/components/page-header";
import { SectionNav } from "@/components/section-nav";
import { StatementTable } from "@/components/statement-table";
import {
  getIncomeStatements,
  getIncomeTtm,
  getProfile,
  getRevenueGeographicSegments,
  getRevenueProductSegments,
} from "@/lib/fmp";
import { reportingCurrency } from "@/lib/format";
import { decodeTicker, displayCompanyName, stockPath } from "@/lib/listings";
import { metricsNav } from "@/lib/nav";
import {
  INCOME_ROWS,
  orderedGeoNames,
  orderedProductNames,
  priorTtmSegmentMap,
  productMetricRows,
  segmentStatementColumns,
  segmentStatementRows,
  toStatementColumns,
  topSegmentNames,
  ttmSegmentMap,
  withStatementHrefs,
  withTtmColumn,
} from "@/lib/statements";

const OPEX_KEYS = new Set([
  "researchAndDevelopmentExpenses",
  "sellingGeneralAndAdministrativeExpenses",
  "operatingExpenses",
]);

export default async function OperatingMetricsPage({
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
  const base = stockPath(ticker, "/metrics");
  const [
    profile,
    annualIncome,
    quarterlyIncome,
    ttmIncome,
    products,
    productQuarters,
    geos,
    geoQuarters,
  ] = await Promise.all([
    getProfile(ticker),
    getIncomeStatements(ticker, "annual", 8),
    getIncomeStatements(ticker, "quarter", 8),
    getIncomeTtm(ticker),
    getRevenueProductSegments(ticker, "annual"),
    getRevenueProductSegments(ticker, "quarter"),
    getRevenueGeographicSegments(ticker, "annual"),
    getRevenueGeographicSegments(ticker, "quarter"),
  ]);
  const currency = reportingCurrency(
    ttmIncome?.reportedCurrency,
    annualIncome[0]?.reportedCurrency,
    products[0]?.reportedCurrency,
  );
  const productTtm = ttmSegmentMap(productQuarters);
  const productPriorTtm = priorTtmSegmentMap(productQuarters);
  const geoTtm = ttmSegmentMap(geoQuarters);
  const geoPriorTtm = priorTtmSegmentMap(geoQuarters);
  const productNames = orderedProductNames(topSegmentNames(products, productTtm));
  const geoNames = orderedGeoNames(topSegmentNames(geos, geoTtm));
  const income = period === "quarter" ? quarterlyIncome : annualIncome;
  const productColumns = segmentStatementColumns(
    period === "quarter" ? productQuarters : products,
    productNames,
    period,
    period === "annual" ? productTtm : null,
    6,
    period === "annual" ? productPriorTtm : null,
    productQuarters[0]?.date,
    { productRollup: true },
  );
  const geoColumns = segmentStatementColumns(
    period === "quarter" ? geoQuarters : geos,
    geoNames,
    period,
    period === "annual" ? geoTtm : null,
    6,
    period === "annual" ? geoPriorTtm : null,
    geoQuarters[0]?.date,
  );
  const opexColumns = withTtmColumn(
    ttmIncome as Record<string, unknown> | null,
    toStatementColumns(income, period).slice(0, 6),
  );
  const shortName = displayCompanyName(profile?.companyName) || ticker;
  const periodQuery = period === "quarter" ? "?period=quarter" : "";

  return (
    <Container>
      <PageHeader
        title={`${shortName} Operating Metrics`}
        description="Product and geographic revenue from company filings, plus operating-expense breakdown. Gross profit by product is omitted because FMP segments are revenue-only."
        actions={
          <PeriodToggle
            period={period}
            annualHref={base}
            quarterHref={`${base}?period=quarter`}
          />
        }
      />
      <SectionNav items={metricsNav(ticker)} />
      <p className="mb-6 text-sm text-muted">
        Full valuation history lives on{" "}
        <Link href={stockPath(ticker, "/financials/metrics")} className="text-link hover:underline">
          Financials → Metrics
        </Link>
        .
      </p>

      {productNames.length > 0 ? (
        <section>
          <div className="mb-3 flex items-end justify-between gap-3">
            <h2 className="text-lg font-semibold text-header">Revenue by Segment</h2>
            <Link href={`${stockPath(ticker, "/metrics/revenue-by-segment")}${periodQuery}`} className="text-sm text-link hover:underline">
              Full table
            </Link>
          </div>
          <StatementTable
            rows={productMetricRows(productNames)}
            columns={productColumns}
            scale="millions"
            currency={currency}
            caption={`Values in millions of ${currency}. Products is the hardware total; Services is reported separately.`}
            downloadName={`${ticker}-metrics-product-${period}`}
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
            <Link href={`${stockPath(ticker, "/metrics/revenue-by-geography")}${periodQuery}`} className="text-sm text-link hover:underline">
              Full table
            </Link>
          </div>
          <StatementTable
            rows={segmentStatementRows(geoNames, "Revenue (Total)", "Revenue")}
            columns={geoColumns}
            scale="millions"
            currency={currency}
            caption={`Values in millions of ${currency}.`}
            downloadName={`${ticker}-metrics-geo-${period}`}
            inlineYoy={false}
          />
        </section>
      ) : null}

      <section className="mt-10">
        <div className="mb-3 flex items-end justify-between gap-3">
          <h2 className="text-lg font-semibold text-header">Operating Expense Breakdown</h2>
          <Link href={`${stockPath(ticker, "/metrics/operating-expense-breakdown")}${periodQuery}`} className="text-sm text-link hover:underline">
            Full table
          </Link>
        </div>
        <StatementTable
          rows={withStatementHrefs(
            INCOME_ROWS.filter((row) => OPEX_KEYS.has(row.key)),
            ticker,
          )}
          columns={opexColumns}
          currency={currency}
          caption={`Amounts are shown in ${currency}. The TTM column uses trailing-twelve-month income-statement lines.`}
          downloadName={`${ticker}-metrics-opex-${period}`}
        />
      </section>
    </Container>
  );
}
