import { StatementMetricPage, periodFrom } from "@/components/statement-metric-page";
import { decodeTicker } from "@/lib/listings";

export default async function DepreciationAmortizationPage({
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
      slug="depreciation-amortization"
      title={`${ticker} Depreciation & Amortization`}
      description="Depreciation and amortization from the cash flow statement."
      field="depreciationAndAmortization"
      kind="cash"
      ttmField="depreciationAndAmortization"
    />
  );
}
