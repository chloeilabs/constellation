import { StatementMetricPage, periodFrom } from "@/components/statement-metric-page";

export default async function CashPage({
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
      title={`${ticker} Cash`}
      description="Cash and short-term investments from the balance sheet."
      field="cashAndShortTermInvestments"
      slug="cash"
      kind="balance"
    />
  );
}
