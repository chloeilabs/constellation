import { StatementMetricPage, periodFrom } from "@/components/statement-metric-page";
import { decodeTicker } from "@/lib/listings";

export default async function EbitdaPage({
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
      title={`${ticker} EBITDA`}
      description="Earnings before interest, taxes, depreciation, and amortization."
      field="ebitda"
      slug="ebitda"
      kind="income"
      ttmField="ebitda"
    />
  );
}
