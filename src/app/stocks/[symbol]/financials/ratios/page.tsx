import { Container } from "@/components/container";
import { FinancialsNav } from "@/components/financials-nav";
import { PageHeader, PeriodToggle } from "@/components/page-header";
import { StatementTable } from "@/components/statement-table";
import { getRatios, getRatiosTtm } from "@/lib/fmp";
import { decodeTicker, stockPath } from "@/lib/listings";
import { RATIO_ROWS, stripTtmSuffix, toStatementColumns, withTtmColumn } from "@/lib/statements";
import type { StatementPeriod } from "@/lib/types";

export default async function RatiosPage({
  params,
  searchParams,
}: {
  params: Promise<{ symbol: string }>;
  searchParams: Promise<{ period?: string }>;
}) {
  const { symbol } = await params;
  const { period: periodParam } = await searchParams;
  const ticker = decodeTicker(symbol);
  const period: StatementPeriod = periodParam === "quarter" ? "quarter" : "annual";
  const [rows, ttm] = await Promise.all([getRatios(ticker, period, 8), getRatiosTtm(ticker)]);
  const base = stockPath(ticker, "/financials/ratios");

  return (
    <Container>
      <PageHeader
        title={`${ticker} Financial Ratios`}
        description="Profitability, liquidity, leverage, and valuation ratios."
        actions={<PeriodToggle period={period} annualHref={base} quarterHref={`${base}?period=quarter`} />}
      />
      <FinancialsNav symbol={ticker} />
      <StatementTable
        rows={RATIO_ROWS}
        columns={withTtmColumn(stripTtmSuffix(ttm as Record<string, unknown> | null), toStatementColumns(rows, period))}
        caption="The TTM column uses trailing-twelve-month ratios. Green/red percentages are year-over-year change for dollar and share rows."
      />
    </Container>
  );
}
