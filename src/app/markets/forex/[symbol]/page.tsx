import { MarketAssetQuote, marketAssetMetadata } from "@/components/market-asset-quote";

export async function generateMetadata({ params }: { params: Promise<{ symbol: string }> }) {
  const { symbol } = await params;
  return marketAssetMetadata(symbol, "forex");
}

export default async function ForexQuotePage({
  params,
  searchParams,
}: {
  params: Promise<{ symbol: string }>;
  searchParams: Promise<{ range?: string }>;
}) {
  const { symbol } = await params;
  const { range } = await searchParams;
  return <MarketAssetQuote symbol={symbol} expected="forex" range={range} />;
}
