import { StatementMetricPage, periodFrom } from "@/components/statement-metric-page";
import { decodeTicker } from "@/lib/listings";

export default async function PretaxMarginPage({
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
      slug="pretax-margin"
      title={`${ticker} Pretax Margin`}
      description="Income before tax as a percentage of revenue."
      field="pretaxProfitMargin"
      ttmField="pretaxProfitMargin"
      kind="income"
      format="percent"
      formula="Pretax Margin = Pretax Income ÷ Revenue"
    />
  );
}
