import { StatementMetricPage, periodFrom } from "@/components/statement-metric-page";
import { decodeTicker } from "@/lib/listings";

export default async function GrossMarginPage({
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
      slug="gross-margin"
      title={`${ticker} Gross Margin`}
      description="Gross profit as a percentage of revenue."
      field="grossProfitMargin"
      ttmField="grossProfitMargin"
      kind="income"
      format="percent"
      formula="Gross Margin = Gross Profit ÷ Revenue"
    />
  );
}
