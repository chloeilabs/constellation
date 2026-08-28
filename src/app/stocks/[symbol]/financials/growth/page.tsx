import { Container } from "@/components/container";
import { FinancialsNav } from "@/components/financials-nav";
import { PageHeader, PeriodToggle, YearToggle } from "@/components/page-header";
import { StatementTable } from "@/components/statement-table";
import { getBalanceSheets, getCashFlows, getIncomeStatements } from "@/lib/fmp";
import { decodeTicker, stockPath } from "@/lib/listings";
import { GROWTH_ROWS, growthFromStatements, spanFrom, statementHref, statementLimit, toStatementColumns } from "@/lib/statements";
import type { StatementPeriod } from "@/lib/types";

export default async function GrowthPage({
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
  const displayCount = statementLimit(period, span);
  const yearOffset = period === "quarter" ? 4 : 1;
  const lookback = displayCount + 10 * yearOffset;
  const [income, cash, balance] = await Promise.all([
    getIncomeStatements(ticker, period, lookback),
    getCashFlows(ticker, period, lookback),
    getBalanceSheets(ticker, period, lookback),
  ]);
  const rows = growthFromStatements({ income, cash, balance, period, limit: displayCount });
  const base = stockPath(ticker, "/financials/growth");

  return (
    <Container>
      <PageHeader
        title={`${ticker} Financial Growth`}
        description="Income, cash flow, and per-share growth rates from live filings. Period rates are sequential; 3-, 5-, and 10-year per-share rows are cumulative."
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
        rows={GROWTH_ROWS}
        columns={toStatementColumns(rows, period)}
        caption="Period-over-period rates except 3/5/10-year per-share rows, which are cumulative change versus that many fiscal years earlier."
        downloadName={`${ticker}-growth-${period}-${span}`}
      />
    </Container>
  );
}
