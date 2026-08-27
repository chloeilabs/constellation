import { notFound, redirect } from "next/navigation";
import { StockHeader } from "@/components/stock-header";
import { getAftermarketQuote, getAftermarketTrade, getProfile, getQuoteSafe, hasFmpKey, mergeAftermarketQuote } from "@/lib/fmp";
import { decodeTicker, marketAssetHref } from "@/lib/listings";
import { indexDisplayName, isIndexTicker } from "@/lib/indexes";

export async function generateMetadata({ params }: { params: Promise<{ symbol: string }> }) {
  const { symbol } = await params;
  const ticker = decodeTicker(symbol);
  const market = marketAssetHref(ticker);
  if (market) redirect(market);
  const isIndex = isIndexTicker(ticker);
  const profile = isIndex ? null : await getProfile(ticker);
  const name = profile?.companyName ?? indexDisplayName(ticker);
  return {
    title: isIndex ? `${name} (${ticker}) Index Price` : `${name} (${ticker}) Stock Price & Overview`,
    description: profile?.description?.slice(0, 160) ?? `${name} price, chart, and related market data.`,
  };
}

export default async function StockLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ symbol: string }>;
}) {
  const { symbol } = await params;
  const ticker = decodeTicker(symbol);
  const market = marketAssetHref(ticker);
  if (market) redirect(market);
  const isIndex = isIndexTicker(ticker);
  const [quote, profile, afterHours, afterTrade] = await Promise.all([
    getQuoteSafe(ticker),
    isIndex ? Promise.resolve(null) : getProfile(ticker),
    isIndex ? Promise.resolve(null) : getAftermarketQuote(ticker),
    isIndex ? Promise.resolve(null) : getAftermarketTrade(ticker),
  ]);
  const extended = mergeAftermarketQuote(afterHours, afterTrade);

  if (!quote && !profile) {
    if (!hasFmpKey()) {
      return (
        <>
          <StockHeader symbol={ticker} quote={null} profile={null} afterHours={null} />
          {children}
        </>
      );
    }
    notFound();
  }

  return (
    <>
      <StockHeader symbol={ticker} quote={quote} profile={profile} afterHours={extended} />
      {children}
    </>
  );
}
