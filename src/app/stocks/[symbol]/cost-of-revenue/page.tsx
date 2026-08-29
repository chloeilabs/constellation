import { StatementMetricPage, periodFrom } from "@/components/statement-metric-page";
import { decodeTicker } from "@/lib/listings";

export default async function CostOfRevenuePage({
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
      slug="cost-of-revenue"
      title={`${ticker} Cost of Revenue`}
      description="Direct costs of goods sold from the income statement."
      field="costOfRevenue"
      kind="income"
      ttmField="costOfRevenue"
    />
  );
}
