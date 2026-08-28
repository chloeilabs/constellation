import { notFound, redirect } from "next/navigation";
import { EtfHeader } from "@/components/etf-header";
import { getAftermarketQuote, getAftermarketTrade, getEtfInfo, getQuote, hasFmpKey, mergeAftermarketQuote } from "@/lib/fmp";
import { decodeTicker, marketAssetHref } from "@/lib/listings";

export async function generateMetadata({ params }: { params: Promise<{ symbol: string }> }) {
  const { symbol } = await params;
  const ticker = decodeTicker(symbol);
  const market = marketAssetHref(ticker);
  if (market) redirect(market);
  const info = await getEtfInfo(ticker);
  return {
    title: `${info?.name ?? ticker} (${ticker}) ETF`,
    description: info?.description?.slice(0, 160) ?? `${ticker} ETF holdings, sectors, countries, and quote.`,
  };
}

export default async function EtfLayout({
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
  const [quote, info, afterHours, afterTrade] = await Promise.all([
    getQuote(ticker),
    getEtfInfo(ticker),
    getAftermarketQuote(ticker),
    getAftermarketTrade(ticker),
  ]);
  const extended = mergeAftermarketQuote(afterHours, afterTrade);

  if (!quote && !info) {
    if (!hasFmpKey()) {
      return (
        <>
          <EtfHeader symbol={ticker} quote={null} info={null} afterHours={null} holdingsCount={null} />
          {children}
        </>
      );
    }
    notFound();
  }

  return (
    <>
      <EtfHeader
        symbol={ticker}
        quote={quote}
        info={info}
        afterHours={extended}
        holdingsCount={info?.holdingsCount || null}
      />
      {children}
    </>
  );
}
