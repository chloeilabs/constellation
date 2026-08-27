import { StatementMetricPage, periodFrom } from "@/components/statement-metric-page";

export default async function OperatingIncomePage({
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
      title={`${ticker} Operating Income`}
      description="Operating profit from the income statement, before interest and taxes."
      field="operatingIncome"
      slug="operating-income"
      kind="income"
      ttmField="operatingIncome"
    />
  );
}
