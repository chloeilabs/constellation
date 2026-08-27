import { redirect } from "next/navigation";
import { getProfile } from "@/lib/fmp";
import { quoteHref } from "@/lib/listings";

const EXCHANGE_SUFFIX: Record<string, string> = {
  nse: "NS",
  bse: "BO",
  lse: "L",
  lon: "L",
  tsx: "TO",
  tsxv: "V",
  asx: "AX",
  hk: "HK",
  hkex: "HK",
  tse: "T",
  tyo: "T",
  jpx: "T",
  xetra: "DE",
  fra: "DE",
  par: "PA",
  epa: "PA",
  sao: "SA",
  b3: "SA",
};

export default async function QuoteAliasPage({ params }: { params: Promise<{ parts: string[] }> }) {
  const { parts } = await params;
  const [first, second] = parts;
  if (!first) redirect("/");

  if (!second) {
    const ticker = decodeURIComponent(first).toUpperCase();
    const profile = await getProfile(ticker);
    redirect(
      quoteHref(ticker, {
        name: profile?.companyName,
        exchange: profile?.exchange,
        exchangeFullName: profile?.exchangeFullName,
        isEtf: profile?.isEtf,
        isFund: profile?.isFund,
      }),
    );
  }

  const exchange = decodeURIComponent(first);
  const ticker = decodeURIComponent(second).toUpperCase();
  const suffix = EXCHANGE_SUFFIX[exchange.toLowerCase()];
  const candidates = ticker.includes(".")
    ? [ticker]
    : suffix
      ? [`${ticker}.${suffix}`, ticker]
      : [ticker];

  for (const candidate of candidates) {
    const profile = await getProfile(candidate);
    if (profile?.symbol) {
      redirect(
        quoteHref(profile.symbol, {
          name: profile.companyName,
          exchange: profile.exchange,
          exchangeFullName: profile.exchangeFullName,
          isEtf: profile.isEtf,
          isFund: profile.isFund,
        }),
      );
    }
  }

  redirect(quoteHref(candidates[0]));
}
