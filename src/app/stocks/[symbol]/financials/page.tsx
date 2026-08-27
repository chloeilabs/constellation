import { Container } from "@/components/container";
import { FinancialsNav } from "@/components/financials-nav";
import { PageHeader, PeriodToggle } from "@/components/page-header";
import { StatementTable } from "@/components/statement-table";
import { getIncomeStatements } from "@/lib/fmp";
import { INCOME_ROWS, toStatementColumns } from "@/lib/statements";
import type { StatementPeriod } from "@/lib/types";

function periodFrom(value?: string): StatementPeriod {
  return value === "quarter" ? "quarter" : "annual";
}

export default async function IncomePage({
  params,
  searchParams,
}: {
  params: Promise<{ symbol: string }>;
  searchParams: Promise<{ period?: string }>;
}) {
  const { symbol } = await params;
  const { period: periodParam } = await searchParams;
  const ticker = symbol.toUpperCase();
  const period = periodFrom(periodParam);
  const rows = await getIncomeStatements(ticker, period, 8);

  return (
    <Container>
      <PageHeader
        title={`${ticker} Income Statement`}
        description="Revenue, expenses, and profitability. Figures in millions of USD except per-share items."
        actions={
          <PeriodToggle
            period={period}
            annualHref={`/stocks/${ticker}/financials`}
            quarterHref={`/stocks/${ticker}/financials?period=quarter`}
          />
        }
      />
      <FinancialsNav symbol={ticker} />
      <StatementTable
        rows={INCOME_ROWS}
        columns={toStatementColumns(rows, period)}
        scale="millions"
        caption="Values in millions. Green/red percentages are year-over-year change."
      />
    </Container>
  );
}
