import { Container } from "@/components/container";
import { FinancialsNav } from "@/components/financials-nav";
import { PageHeader, PeriodToggle, YearToggle } from "@/components/page-header";
import { StatementTable } from "@/components/statement-table";
import { getEstimates, getIncomeStatements, getIncomeTtm, getKeyMetrics, getKeyMetricsTtm, getQuote, getRatios, getRatiosTtm } from "@/lib/fmp";
import { decodeTicker, stockPath } from "@/lib/listings";
import {
  RATIO_ROWS,
  derivedStatementMetrics,
  mergeStatementValues,
  spanFrom,
  statementHref,
  statementLimit,
  stripTtmSuffix,
  toStatementColumns,
  withStatementHrefs,
  withTtmColumn,
} from "@/lib/statements";
import type { StatementPeriod } from "@/lib/types";
import { actualToEstimateCagr, estimateCagr, forwardPe, pegRatio, trailingPe } from "@/lib/valuation";

export default async function RatiosPage({
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
  const [rows, ttm, metrics, metricsTtm, incomeTtm, estimates, quote, annualIncome] = await Promise.all([
    getRatios(ticker, period, statementLimit(period, span)),
    getRatiosTtm(ticker),
    getKeyMetrics(ticker, period, statementLimit(period, span)),
    getKeyMetricsTtm(ticker),
    getIncomeTtm(ticker),
    getEstimates(ticker, "annual"),
    getQuote(ticker),
    getIncomeStatements(ticker, "annual", 1),
  ]);
  const metricKeys = [
    "returnOnInvestedCapital",
    "returnOnCapitalEmployed",
    "earningsYield",
    "freeCashFlowYield",
    "netDebtToEBITDA",
  ];
  let columns = withTtmColumn(
    {
      ...stripTtmSuffix(ttm as Record<string, unknown> | null),
      ...stripTtmSuffix(metricsTtm as Record<string, unknown> | null),
    },
    toStatementColumns(rows, period),
  );
  columns = mergeStatementValues(columns, metrics, metricKeys);
  const derived = incomeTtm
    ? derivedStatementMetrics(incomeTtm as unknown as Record<string, unknown>)
    : null;
  const pe = trailingPe(quote?.price, incomeTtm?.epsDiluted ?? incomeTtm?.eps);
  const epsCagr =
    actualToEstimateCagr(
      annualIncome[0]?.epsDiluted ?? annualIncome[0]?.eps,
      annualIncome[0]?.date,
      estimates,
      "epsAvg",
      3,
    ) ?? estimateCagr(estimates, "epsAvg", 3);
  columns = columns.map((column) => {
    if (column.key !== "ttm" && column.label !== "TTM") return column;
    return {
      ...column,
      values: {
        ...column.values,
        ...(derived
          ? {
              ebitdaMargin: derived.ebitdaMargin,
              ebitMargin: derived.ebitMargin,
              pretaxProfitMargin: derived.pretaxProfitMargin,
              netProfitMargin: derived.netProfitMargin,
              grossProfitMargin: derived.grossProfitMargin,
              operatingProfitMargin: derived.operatingProfitMargin,
              effectiveTaxRate: derived.effectiveTaxRate,
            }
          : {}),
        forwardPe: forwardPe(quote?.price, estimates),
        priceToEarningsGrowthRatio: pegRatio(pe, epsCagr),
        priceToEarningsRatio: pe ?? column.values.priceToEarningsRatio,
      },
    };
  });
  const base = stockPath(ticker, "/financials/ratios");

  return (
    <Container>
      <PageHeader
        title={`${ticker} Financial Ratios`}
        description="Profitability, liquidity, leverage, and valuation ratios."
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
      <StatementTable
        rows={withStatementHrefs(RATIO_ROWS, ticker)}
        columns={columns}
        caption="The TTM column uses trailing-twelve-month ratios, with EBITDA and income margins from EBIT+D&A and reported income. Forward PE and PEG use live price and 3-year consensus EPS CAGR. Return and yield rows come from key metrics."
        downloadName={`${ticker}-ratios-${period}-${span}`}
      />
    </Container>
  );
}
