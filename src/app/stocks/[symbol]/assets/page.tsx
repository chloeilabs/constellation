import { StatementMetricPage, periodFrom } from "@/components/statement-metric-page";
import { decodeTicker } from "@/lib/listings";

export default async function AssetsPage({
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
      title={`${ticker} Total Assets`}
      description="Reported total assets from the balance sheet."
      field="totalAssets"
      slug="assets"
      kind="balance"
    />
  );
}
