import { redirect } from "next/navigation";
import { getProfile } from "@/lib/fmp";
import { marketAssetHref, quoteHref } from "@/lib/listings";
import { isQuoteSubpage } from "@/lib/quote-subpages";

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

function withSubpath(href: string, segments: string[]) {
  const extra = segments.map((part) => decodeURIComponent(part)).filter(Boolean);
  if (extra.length === 0) return href;
  return `${href.replace(/\/$/, "")}/${extra.join("/")}`;
}

async function redirectQuote(ticker: string, extra: string[] = []): Promise<never> {
  const market = marketAssetHref(ticker);
  if (market) redirect(withSubpath(market, extra));
  const profile = await getProfile(ticker);
  redirect(
    withSubpath(
      quoteHref(ticker, {
        name: profile?.companyName,
        exchange: profile?.exchange,
        exchangeFullName: profile?.exchangeFullName,
        isEtf: profile?.isEtf,
        isFund: profile?.isFund,
      }),
      extra,
    ),
  );
}

export default async function QuoteAliasPage({ params }: { params: Promise<{ parts: string[] }> }) {
  const { parts } = await params;
  const [first, second, ...rest] = parts;
  if (!first) redirect("/");

  if (!second) {
    const token = decodeURIComponent(first);
    if (token.toLowerCase() === "compare") redirect("/compare");
    await redirectQuote(token.toUpperCase());
  }

  const exchange = decodeURIComponent(first);
  const token = decodeURIComponent(second);
  if (exchange.toLowerCase() === "compare") {
    redirect(`/compare?symbols=${token.toUpperCase()}`);
  }
  if (exchange.toLowerCase() === "congress") {
    redirect(`/congress/${token}`);
  }
  if (exchange.toLowerCase() === "13f") {
    redirect(`/institutional/${token}`);
  }
  if (isQuoteSubpage(token)) {
    await redirectQuote(exchange.toUpperCase(), [token, ...rest]);
  }

  const ticker = token.toUpperCase();
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
        withSubpath(
          quoteHref(profile.symbol, {
            name: profile.companyName,
            exchange: profile.exchange,
            exchangeFullName: profile.exchangeFullName,
            isEtf: profile.isEtf,
            isFund: profile.isFund,
          }),
          rest,
        ),
      );
    }
  }

  redirect(withSubpath(quoteHref(candidates[0]), rest));
}
