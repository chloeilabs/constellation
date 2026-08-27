import { StatementMetricPage, periodFrom } from "@/components/statement-metric-page";
import { decodeTicker } from "@/lib/listings";

export default async function EbitPage({
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
      slug="ebit"
      title={`${ticker} EBIT`}
      description="Earnings before interest and taxes from the income statement."
      field="ebit"
      kind="income"
      ttmField="ebit"
    />
  );
}
