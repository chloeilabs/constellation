import { StatementMetricPage, periodFrom } from "@/components/statement-metric-page";

export default async function EquityPage({
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
      title={`${ticker} Shareholders' Equity`}
      description="Book value of equity from the balance sheet."
      field="totalStockholdersEquity"
      slug="equity"
      kind="balance"
    />
  );
}
