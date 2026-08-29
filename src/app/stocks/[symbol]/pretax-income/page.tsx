import { StatementMetricPage, periodFrom } from "@/components/statement-metric-page";
import { decodeTicker } from "@/lib/listings";

export default async function PretaxIncomePage({
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
      slug="pretax-income"
      title={`${ticker} Pretax Income`}
      description="Income before income taxes from the income statement."
      field="incomeBeforeTax"
      kind="income"
      ttmField="incomeBeforeTax"
    />
  );
}
