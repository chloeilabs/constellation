import { StatementMetricPage, periodFrom } from "@/components/statement-metric-page";
import { decodeTicker } from "@/lib/listings";

export default async function ProfitMarginPage({
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
      slug="profit-margin"
      title={`${ticker} Profit Margin`}
      description="Net income as a percentage of revenue."
      field="netProfitMargin"
      ttmField="netProfitMargin"
      kind="income"
      format="percent"
      formula="Profit Margin = Net Income ÷ Revenue"
    />
  );
}
