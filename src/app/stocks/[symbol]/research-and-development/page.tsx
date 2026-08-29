import { StatementMetricPage, periodFrom } from "@/components/statement-metric-page";
import { decodeTicker } from "@/lib/listings";

export default async function ResearchAndDevelopmentPage({
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
      slug="research-and-development"
      title={`${ticker} Research & Development`}
      description="Research and development expense from the income statement."
      field="researchAndDevelopmentExpenses"
      kind="income"
      ttmField="researchAndDevelopmentExpenses"
    />
  );
}
