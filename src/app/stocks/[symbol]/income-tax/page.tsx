import { StatementMetricPage, periodFrom } from "@/components/statement-metric-page";
import { decodeTicker } from "@/lib/listings";

export default async function IncomeTaxPage({
  params,
  searchParams,
}: {
  params: Promise<{ symbol: string }>;
  searchParams: Promise<{ period?: string }>;
}) {
  const { symbol } = await params;
  const { period: periodParam } = await searchParams;
  const ticker = decodeTicker(symbol);
  return (
    <StatementMetricPage
      symbol={ticker}
      period={periodFrom(periodParam)}
      slug="income-tax"
      title={`${ticker} Income Tax`}
      description="Income tax expense from the income statement."
      field="incomeTaxExpense"
      kind="income"
      ttmField="incomeTaxExpense"
    />
  );
}
