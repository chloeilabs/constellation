import { notFound } from "next/navigation";
import { StockHeader } from "@/components/stock-header";
import { getAftermarketQuote, getProfile, getQuote, hasFmpKey } from "@/lib/fmp";

export async function generateMetadata({ params }: { params: Promise<{ symbol: string }> }) {
  const { symbol } = await params;
  const profile = await getProfile(symbol);
  const name = profile?.companyName ?? symbol.toUpperCase();
  return {
    title: `${name} (${symbol.toUpperCase()}) Stock Price & Overview`,
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
  const ticker = symbol.toUpperCase();
  const [quote, profile, afterHours] = await Promise.all([
    getQuote(ticker),
    getProfile(ticker),
    getAftermarketQuote(ticker),
  ]);

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
      <StockHeader symbol={ticker} quote={quote} profile={profile} afterHours={afterHours} />
      {children}
    </>
  );
}
