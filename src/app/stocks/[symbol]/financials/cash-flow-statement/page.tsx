import { Container } from "@/components/container";
import { FinancialsNav } from "@/components/financials-nav";
import { PageHeader, PeriodToggle } from "@/components/page-header";
import { StatementTable } from "@/components/statement-table";
import { getCashFlows } from "@/lib/fmp";
import { CASH_FLOW_ROWS } from "@/lib/statements";
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
  const columns = rows.map((row) => ({
    key: `${row.fiscalYear}-${row.period}-${row.date}`,
    label: period === "quarter" ? `${row.period} ${row.fiscalYear}` : row.fiscalYear,
    values: row as unknown as Record<string, unknown>,
  }));

  return (
    <Container>
      <PageHeader
        title={`${ticker} Cash Flow Statement`}
        description="Operating, investing, and financing cash flows."
        actions={
          <PeriodToggle
            period={period}
            annualHref={`/stocks/${ticker}/financials/cash-flow-statement`}
            quarterHref={`/stocks/${ticker}/financials/cash-flow-statement?period=quarter`}
          />
        }
      />
      <FinancialsNav symbol={ticker} />
      <StatementTable rows={CASH_FLOW_ROWS} columns={columns} />
    </Container>
  );
}
