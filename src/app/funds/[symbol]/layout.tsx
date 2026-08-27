import { notFound, redirect } from "next/navigation";
import { FundHeader } from "@/components/fund-header";
import { getEtfInfo, getProfile, getQuote, hasFmpKey } from "@/lib/fmp";
import { decodeTicker, marketAssetHref } from "@/lib/listings";

export async function generateMetadata({ params }: { params: Promise<{ symbol: string }> }) {
  const { symbol } = await params;
  const ticker = decodeTicker(symbol);
  const market = marketAssetHref(ticker);
  if (market) redirect(market);
  const [profile, info] = await Promise.all([getProfile(ticker), getEtfInfo(ticker)]);
  const name = info?.name ?? profile?.companyName ?? ticker;
  return {
    title: `${name} (${ticker}) Mutual Fund`,
    description:
      info?.description?.slice(0, 160) ??
      profile?.description?.slice(0, 160) ??
      `${name} mutual fund holdings, dividends, and quote from Financial Modeling Prep.`,
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
  const [quote, profile, info] = await Promise.all([getQuote(ticker), getProfile(ticker), getEtfInfo(ticker)]);

  if (!quote && !profile && !info) {
    if (!hasFmpKey()) {
      return (
        <>
          <FundHeader symbol={ticker} quote={null} profile={null} info={null} />
          {children}
        </>
      );
    }
    notFound();
  }

  return (
    <>
      <FundHeader symbol={ticker} quote={quote} profile={profile} info={info} />
      {children}
    </>
  );
}
