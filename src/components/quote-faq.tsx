import { formatAnalystConsensus, formatCompactUsd, formatDate, formatInteger, formatPercentPlain, formatPrice, formatRatio } from "@/lib/format";
import type { FmpGradesConsensus, FmpIncomeStatement, FmpPriceTarget, FmpProfile, FmpQuote, FmpRatiosTtm } from "@/lib/types";

export function QuoteFaq({
  symbol,
  quote,
  profile,
  ttm,
  ratios,
  target,
  grades,
}: {
  symbol: string;
  quote: FmpQuote | null;
  profile: FmpProfile | null;
  ttm: FmpIncomeStatement | null;
  ratios: FmpRatiosTtm | null;
  target?: FmpPriceTarget | null;
  grades?: FmpGradesConsensus | null;
}) {
  const name = profile?.companyName ?? quote?.name ?? symbol;
  const price = quote?.price ?? profile?.price;
  const pe = typeof ratios?.priceToEarningsRatioTTM === "number" ? ratios.priceToEarningsRatioTTM : quote?.pe;
  const yieldValue = typeof ratios?.dividendYieldTTM === "number" ? ratios.dividendYieldTTM : null;
  const items = [
    {
      q: `What is ${symbol}'s market cap?`,
      a: `${name} has a market capitalization of ${formatCompactUsd(quote?.marketCap ?? profile?.marketCap)}.`,
    },
    {
      q: `What is the PE ratio for ${symbol}?`,
      a: pe != null ? `${name} trades at a trailing PE ratio of ${formatRatio(pe)}.` : `A trailing PE ratio is not available for ${symbol}.`,
    },
    {
      q: `How much revenue does ${name} make?`,
      a: ttm?.revenue
        ? `${name} reported trailing-twelve-month revenue of ${formatCompactUsd(ttm.revenue)}.`
        : `Trailing revenue is not available for ${symbol}.`,
    },
    {
      q: `Does ${symbol} pay a dividend?`,
      a: yieldValue
        ? `Yes. The trailing dividend yield is ${formatPercentPlain(yieldValue)}.`
        : `${name} does not currently show a trailing dividend yield in FMP data.`,
    },
    {
      q: `How many employees does ${name} have?`,
      a: profile?.fullTimeEmployees
        ? `${name} reports ${formatInteger(Number(profile.fullTimeEmployees))} full-time employees.`
        : `Headcount is not available for ${symbol}.`,
    },
    {
      q: `What do analysts think of ${symbol}?`,
      a:
        grades || target
          ? [
              grades?.consensus ? `Consensus is ${formatAnalystConsensus(grades)}.` : null,
              target?.targetConsensus && price
                ? `The average price target is $${formatPrice(target.targetConsensus)}.`
                : null,
            ]
              .filter(Boolean)
              .join(" ")
          : `No analyst consensus is available for ${symbol}.`,
    },
    {
      q: `What sector is ${symbol} in?`,
      a: profile?.sector
        ? `${name} is classified in ${profile.sector}${profile.industry ? ` (${profile.industry})` : ""}.`
        : `Sector data is not available for ${symbol}.`,
    },
    {
      q: `When did ${symbol} go public?`,
      a: profile?.ipoDate ? `${name} listed on ${formatDate(profile.ipoDate)}.` : `IPO date is not available for ${symbol}.`,
    },
  ];

  return (
    <section className="mt-10">
      <h2 className="mb-3 text-xl font-semibold text-header">FAQ</h2>
      <dl className="divide-y divide-border rounded-lg border border-border">
        {items.map((item) => (
          <div key={item.q} className="px-4 py-3">
            <dt className="text-sm font-semibold text-header">{item.q}</dt>
            <dd className="mt-1 text-sm leading-6 text-header/90">{item.a}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
