import { Container } from "@/components/container";
import { PageHeader, PeriodToggle } from "@/components/page-header";
import { SectionNav } from "@/components/section-nav";
import { StatementTable } from "@/components/statement-table";
import { getIncomeStatements, getIncomeTtm, getProfile } from "@/lib/fmp";
import { reportingCurrency } from "@/lib/format";
import { decodeTicker, displayCompanyName, stockPath } from "@/lib/listings";
import { metricsNav } from "@/lib/nav";
import { INCOME_ROWS, toStatementColumns, withStatementHrefs, withTtmColumn } from "@/lib/statements";

const OPEX_KEYS = new Set([
  "researchAndDevelopmentExpenses",
  "sellingGeneralAndAdministrativeExpenses",
  "operatingExpenses",
]);

export default async function OperatingExpenseBreakdownPage({
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
  const base = stockPath(ticker, "/metrics/operating-expense-breakdown");
  const [profile, income, ttmIncome] = await Promise.all([
    getProfile(ticker),
    getIncomeStatements(ticker, period, period === "quarter" ? 16 : 12),
    getIncomeTtm(ticker),
  ]);
  const currency = reportingCurrency(ttmIncome?.reportedCurrency, income[0]?.reportedCurrency);
  const columns = withTtmColumn(ttmIncome as Record<string, unknown> | null, toStatementColumns(income, period));
  const shortName = displayCompanyName(profile?.companyName) || ticker;

  return (
    <Container>
      <PageHeader
        title={`${shortName} Operating Expense Breakdown`}
        description="Research & development, SG&A, and total operating expenses from live income statements."
        actions={
          <PeriodToggle period={period} annualHref={base} quarterHref={`${base}?period=quarter`} />
        }
      />
      <SectionNav items={metricsNav(ticker)} />
      <StatementTable
        rows={withStatementHrefs(
          INCOME_ROWS.filter((row) => OPEX_KEYS.has(row.key)),
          ticker,
        )}
        columns={columns}
        currency={currency}
        caption={`Amounts are shown in ${currency}. The TTM column uses trailing-twelve-month income-statement lines.`}
        downloadName={`${ticker}-operating-expense-breakdown-${period}`}
      />
    </Container>
  );
}
