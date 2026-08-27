import { notFound } from "next/navigation";
import { StockHeader } from "@/components/stock-header";
import {
  getAftermarketQuote,
  getAftermarketTrade,
  getProfile,
  getQuote,
  getQuotes,
  hasFmpKey,
  mergeAftermarketQuote,
} from "@/lib/fmp";
import { INDEX_LABELS } from "@/lib/statements";

function tickerFromParam(symbol: string) {
  try {
    return decodeURIComponent(symbol).toUpperCase();
  } catch {
    return symbol.toUpperCase();
  }
}

export async function generateMetadata({ params }: { params: Promise<{ symbol: string }> }) {
  const { symbol } = await params;
  const ticker = tickerFromParam(symbol);
  const profile = ticker.startsWith("^") ? null : await getProfile(ticker);
  const name = profile?.companyName ?? INDEX_LABELS[ticker] ?? ticker;
  return {
    title: `${name} (${ticker}) Stock Price & Overview`,
    description: profile?.description?.slice(0, 160) ?? `${name} stock price, financials, news, and forecasts.`,
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
  const ticker = tickerFromParam(symbol);
  const isIndex = ticker.startsWith("^");
  const [quote, profile, afterHours, afterTrade] = await Promise.all([
    isIndex ? getQuotes([ticker]).then((rows) => rows[0] ?? null) : getQuote(ticker),
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
