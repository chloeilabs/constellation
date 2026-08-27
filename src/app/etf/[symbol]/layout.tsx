import { notFound } from "next/navigation";
import { EtfHeader } from "@/components/etf-header";
import { getAftermarketQuote, getAftermarketTrade, getEtfInfo, getQuote, hasFmpKey, mergeAftermarketQuote } from "@/lib/fmp";

export async function generateMetadata({ params }: { params: Promise<{ symbol: string }> }) {
  const { symbol } = await params;
  const info = await getEtfInfo(symbol);
  const ticker = symbol.toUpperCase();
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
  const ticker = symbol.toUpperCase();
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
          <EtfHeader symbol={ticker} quote={null} info={null} afterHours={null} />
          {children}
        </>
      );
    }
    notFound();
  }

  return (
    <>
      <EtfHeader symbol={ticker} quote={quote} info={info} afterHours={extended} />
      {children}
    </>
  );
}
