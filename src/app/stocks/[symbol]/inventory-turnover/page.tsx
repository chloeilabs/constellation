import { RatioMetricPage, periodFrom } from "@/components/ratio-metric-page";
import { decodeTicker } from "@/lib/listings";

export default async function InventoryTurnoverPage({
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
    <RatioMetricPage
      symbol={ticker}
      period={periodFrom(periodParam)}
      slug="inventory-turnover"
      title={`${ticker} Inventory Turnover`}
      description="Cost of revenue divided by average inventory from FMP filings."
      field="inventoryTurnover"
      ttmField="inventoryTurnoverTTM"
      valueLabel="Inventory Turnover"
      formula="Inventory Turnover = Cost of Revenue ÷ Average Inventory"
      priceBased
    />
  );
}
