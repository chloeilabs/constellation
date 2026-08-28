import { MarketAssetNews } from "@/components/market-asset-news";
import { marketAssetMetadata } from "@/components/market-asset-quote";

export async function generateMetadata({ params }: { params: Promise<{ symbol: string }> }) {
  const { symbol } = await params;
  const meta = await marketAssetMetadata(symbol, "crypto");
  return {
    title: `${meta.title.replace(" Price", "")} News`,
    description: `Latest headlines tagged to this crypto pair from Financial Modeling Prep.`,
  };
}

export default async function CryptoNewsPage({
  params,
  searchParams,
}: {
  params: Promise<{ symbol: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { symbol } = await params;
  const { page } = await searchParams;
  return <MarketAssetNews symbol={symbol} expected="crypto" page={page} />;
}
