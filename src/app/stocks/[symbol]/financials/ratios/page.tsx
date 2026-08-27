import { Container } from "@/components/container";
import { FinancialsNav } from "@/components/financials-nav";
import { PageHeader, PeriodToggle, YearToggle } from "@/components/page-header";
import { StatementTable } from "@/components/statement-table";
import { getRatios, getRatiosTtm } from "@/lib/fmp";
import { decodeTicker, stockPath } from "@/lib/listings";
import { RATIO_ROWS, spanFrom, statementHref, statementLimit, stripTtmSuffix, toStatementColumns, withTtmColumn } from "@/lib/statements";
import type { StatementPeriod } from "@/lib/types";

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
  const [rows, ttm] = await Promise.all([getRatios(ticker, period, statementLimit(period, span)), getRatiosTtm(ticker)]);
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
        rows={RATIO_ROWS}
        columns={withTtmColumn(stripTtmSuffix(ttm as Record<string, unknown> | null), toStatementColumns(rows, period))}
        caption="The TTM column uses trailing-twelve-month ratios. Green/red percentages are year-over-year change for dollar and share rows."
        downloadName={`${ticker}-ratios-${period}-${span}`}
      />
    </Container>
  );
}
