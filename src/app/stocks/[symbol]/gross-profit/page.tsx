import { StatementMetricPage, periodFrom } from "@/components/statement-metric-page";
import { decodeTicker } from "@/lib/listings";

export default async function GrossProfitPage({
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
      title={`${ticker} Gross Profit`}
      description="Revenue minus cost of revenue from the income statement."
      field="grossProfit"
      slug="gross-profit"
      kind="income"
      ttmField="grossProfit"
    />
  );
}
