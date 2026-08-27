import { Container } from "@/components/container";
import { FinancialsNav } from "@/components/financials-nav";
import { PageHeader, PeriodToggle } from "@/components/page-header";
import { StatementTable } from "@/components/statement-table";
import { getCashFlows } from "@/lib/fmp";
import { CASH_FLOW_ROWS, toStatementColumns } from "@/lib/statements";
import type { StatementPeriod } from "@/lib/types";

export default async function CashFlowPage({
  params,
  searchParams,
}: {
  params: Promise<{ symbol: string }>;
  searchParams: Promise<{ period?: string }>;
}) {
  const { symbol } = await params;
  const { period: periodParam } = await searchParams;
  const ticker = symbol.toUpperCase();
  const period: StatementPeriod = periodParam === "quarter" ? "quarter" : "annual";
  const rows = await getCashFlows(ticker, period, 8);

  return (
    <Container>
      <PageHeader
        title={`${ticker} Cash Flow Statement`}
        description="Operating, investing, and financing cash flows. Figures in millions of USD."
        actions={
          <PeriodToggle
            period={period}
            annualHref={`/stocks/${ticker}/financials/cash-flow-statement`}
            quarterHref={`/stocks/${ticker}/financials/cash-flow-statement?period=quarter`}
          />
        }
      />
      <FinancialsNav symbol={ticker} />
      <StatementTable
        rows={CASH_FLOW_ROWS}
        columns={toStatementColumns(rows, period)}
        scale="millions"
        caption="Values in millions. Green/red percentages are year-over-year change."
      />
    </Container>
  );
}
