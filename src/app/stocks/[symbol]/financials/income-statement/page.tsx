import { Container } from "@/components/container";
import { FinancialsNav } from "@/components/financials-nav";
import { PageHeader, PeriodToggle } from "@/components/page-header";
import { StatementTable } from "@/components/statement-table";
import { getIncomeStatements } from "@/lib/fmp";
import { reportingCurrency } from "@/lib/format";
import { INCOME_ROWS, toStatementColumns } from "@/lib/statements";
import type { StatementPeriod } from "@/lib/types";

function periodFrom(value?: string): StatementPeriod {
  return value === "quarter" ? "quarter" : "annual";
}

export default async function IncomeStatementPage({
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
  const currency = reportingCurrency(rows[0]?.reportedCurrency);

  return (
    <Container>
      <PageHeader
        title={`${ticker} Income Statement`}
        description={`Revenue, expenses, and profitability. Figures in millions of ${currency} except per-share items.`}
        actions={
          <PeriodToggle
            period={period}
            annualHref={`/stocks/${ticker}/financials/income-statement`}
            quarterHref={`/stocks/${ticker}/financials/income-statement?period=quarter`}
          />
        }
      />
      <FinancialsNav symbol={ticker} />
      <StatementTable
        rows={INCOME_ROWS}
        columns={toStatementColumns(rows, period)}
        scale="millions"
        currency={currency}
        caption={`Values in millions of ${currency}. Green/red percentages are year-over-year change.`}
      />
    </Container>
  );
}
