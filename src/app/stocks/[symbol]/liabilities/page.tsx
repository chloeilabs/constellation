import { StatementMetricPage, periodFrom } from "@/components/statement-metric-page";

export default async function LiabilitiesPage({
  params,
  searchParams,
}: {
  params: Promise<{ symbol: string }>;
  searchParams: Promise<{ period?: string }>;
}) {
  const { symbol } = await params;
  const { period: periodParam } = await searchParams;
  const ticker = symbol.toUpperCase();
  return (
    <StatementMetricPage
      symbol={ticker}
      period={periodFrom(periodParam)}
      title={`${ticker} Total Liabilities`}
      description="Reported total liabilities from the balance sheet."
      field="totalLiabilities"
      slug="liabilities"
      kind="balance"
    />
  );
}
