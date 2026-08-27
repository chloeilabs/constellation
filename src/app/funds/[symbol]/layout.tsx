import { notFound, redirect } from "next/navigation";
import { FundHeader } from "@/components/fund-header";
import { getProfile, getQuote, hasFmpKey } from "@/lib/fmp";
import { decodeTicker, marketAssetHref } from "@/lib/listings";

export async function generateMetadata({ params }: { params: Promise<{ symbol: string }> }) {
  const { symbol } = await params;
  const market = marketAssetHref(decodeTicker(symbol));
  if (market) redirect(market);
  const profile = await getProfile(symbol);
  const ticker = symbol.toUpperCase();
  const name = profile?.companyName ?? ticker;
  return {
    title: `${name} (${ticker}) Mutual Fund`,
    description: profile?.description?.slice(0, 160) ?? `${name} mutual fund price and profile from Financial Modeling Prep.`,
  };
}

export default async function FundLayout({
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
  const [quote, profile] = await Promise.all([getQuote(ticker), getProfile(ticker)]);

  if (!quote && !profile) {
    if (!hasFmpKey()) {
      return (
        <>
          <FundHeader symbol={ticker} quote={null} profile={null} />
          {children}
        </>
      );
    }
    notFound();
  }

  return (
    <>
      <FundHeader symbol={ticker} quote={quote} profile={profile} />
      {children}
    </>
  );
}
