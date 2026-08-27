import { Container } from "@/components/container";
import { FinancialsNav } from "@/components/financials-nav";
import { PageHeader, PeriodToggle } from "@/components/page-header";
import { StatementTable } from "@/components/statement-table";
import { getBalanceSheets } from "@/lib/fmp";
import { reportingCurrency } from "@/lib/format";
import { BALANCE_ROWS, toStatementColumns } from "@/lib/statements";
import type { StatementPeriod } from "@/lib/types";

export default async function BalanceSheetPage({
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
  const rows = await getBalanceSheets(ticker, period, 8);
  const currency = reportingCurrency(rows[0]?.reportedCurrency);

  return (
    <Container>
      <PageHeader
        title={`${ticker} Balance Sheet`}
        description={`Assets, liabilities, and shareholders' equity. Figures in millions of ${currency}.`}
        actions={
          <PeriodToggle
            period={period}
            annualHref={`/stocks/${ticker}/financials/balance-sheet`}
            quarterHref={`/stocks/${ticker}/financials/balance-sheet?period=quarter`}
          />
        }
      />
      <FinancialsNav symbol={ticker} />
      <StatementTable
        rows={BALANCE_ROWS}
        columns={toStatementColumns(rows, period)}
        scale="millions"
        currency={currency}
        caption={`Values in millions of ${currency}. Green/red percentages are year-over-year change.`}
      />
    </Container>
  );
}
