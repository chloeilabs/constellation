import type { ReactNode } from "react";
import Link from "next/link";
import { ChangePercent } from "@/components/change";
import {
  formatAnalystConsensus,
  formatCompactMoney,
  formatDate,
  formatInteger,
  formatMoney,
  formatNumber,
  formatPercentPlain,
  formatRatio,
  rangeLabel,
} from "@/lib/format";
import { stockPath } from "@/lib/listings";
import { indicatedAnnualDividend } from "@/lib/utils";
import type {
  FmpDividend,
  FmpGradesConsensus,
  FmpIncomeGrowth,
  FmpIncomeStatement,
  FmpPriceTarget,
  FmpProfile,
  FmpQuote,
  FmpRatings,
  FmpRatiosTtm,
  FmpScores,
} from "@/lib/types";

function withYoy(value: ReactNode, yoy: number | null | undefined) {
  return (
    <span className="inline-flex items-center gap-2">
      {value}
      {typeof yoy === "number" ? <ChangePercent value={yoy} alreadyPercent={false} className="text-xs" /> : null}
    </span>
  );
}

export function StatGrid({
  items,
}: {
  items: { label: string; value: ReactNode; href?: string }[];
}) {
  return (
    <dl className="grid grid-cols-1 overflow-hidden rounded-lg border border-border sm:grid-cols-2">
      {items.map((item) => (
        <div
          key={item.label}
          className="flex items-center justify-between gap-3 border-b border-border px-3 py-1.5 last:border-b-0 sm:odd:border-r"
        >
          <dt className="text-[13px] text-muted">
            {item.href ? (
              <Link href={item.href} className="text-link hover:underline">
                {item.label}
              </Link>
            ) : (
              item.label
            )}
          </dt>
          <dd className="tabular text-[13px] font-medium">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function QuoteStats({
  symbol,
  quote,
  profile,
  ttm,
  ratios,
  target,
  grades,
  dividend,
  growth,
  earningsDate,
  nextEarningsDate,
  earningsSurprise,
  forwardPe,
  dcf,
  marketCapYoy,
  sharesYoy,
  ttmYoy,
  ratings,
  scores,
}: {
  symbol: string;
  quote: FmpQuote | null;
  profile: FmpProfile | null;
  ttm: FmpIncomeStatement | null;
  ratios: FmpRatiosTtm | null;
  target: FmpPriceTarget | null;
  grades: FmpGradesConsensus | null;
  dividend: FmpDividend | null;
  growth?: FmpIncomeGrowth | null;
  earningsDate?: string | null;
  nextEarningsDate?: string | null;
  earningsSurprise?: number | null;
  forwardPe?: number | null;
  dcf?: number | null;
  marketCapYoy?: number | null;
  sharesYoy?: number | null;
  ratings?: FmpRatings | null;
  scores?: FmpScores | null;
  ttmYoy?: {
    revenue?: number | null;
    grossProfit?: number | null;
    operatingIncome?: number | null;
    netIncome?: number | null;
    eps?: number | null;
  } | null;
}) {
  const pe = typeof ratios?.priceToEarningsRatioTTM === "number" ? ratios.priceToEarningsRatioTTM : quote?.pe ?? null;
  const currency = profile?.currency || "USD";
  const money = (value: number | null | undefined) => formatCompactMoney(value, currency);
  const px = (value: number | null | undefined) => formatMoney(value, currency);
  const epsGrowth = ttmYoy?.eps ?? growth?.growthEPSDiluted ?? growth?.growthEPS;
  const reportedPeg = typeof ratios?.priceToEarningsGrowthRatioTTM === "number" ? ratios.priceToEarningsGrowthRatioTTM : null;
  const derivedPeg = pe != null && typeof epsGrowth === "number" && epsGrowth > 0 ? pe / (epsGrowth * 100) : null;
  const peg = reportedPeg ?? derivedPeg;
  const upside =
    target?.targetConsensus && quote?.price
      ? ((target.targetConsensus - quote.price) / quote.price) * 100
      : null;
  const dcfUpside = dcf != null && quote?.price ? ((dcf - quote.price) / quote.price) * 100 : null;
  const base = stockPath(symbol);
  const annualDividend = indicatedAnnualDividend(dividend, profile?.lastDividend);
  const dividendYield = typeof ratios?.dividendYieldTTM === "number" ? ratios.dividendYieldTTM : null;
  const dividendValue =
    annualDividend != null
      ? `${px(annualDividend)}${dividendYield != null ? ` (${formatPercentPlain(dividendYield)})` : ""}`
      : "—";

  return (
    <StatGrid
      items={[
        { label: "Market Cap", href: `${base}/market-cap`, value: withYoy(money(quote?.marketCap ?? profile?.marketCap), marketCapYoy) },
        { label: "Revenue (ttm)", href: `${base}/revenue`, value: withYoy(money(ttm?.revenue), ttmYoy?.revenue ?? growth?.growthRevenue) },
        { label: "Gross Profit (ttm)", href: `${base}/gross-profit`, value: withYoy(money(ttm?.grossProfit), ttmYoy?.grossProfit) },
        { label: "Operating Income (ttm)", href: `${base}/operating-income`, value: withYoy(money(ttm?.operatingIncome), ttmYoy?.operatingIncome) },
        { label: "EBITDA (ttm)", href: `${base}/ebitda`, value: money(ttm?.ebitda) },
        { label: "Net Income (ttm)", href: `${base}/net-income`, value: withYoy(money(ttm?.netIncome), ttmYoy?.netIncome ?? growth?.growthNetIncome) },
        { label: "Shares Out", href: `${base}/shares`, value: withYoy(formatCompactMoney(ttm?.weightedAverageShsOutDil, "USD").replace("$", ""), sharesYoy) },
        { label: "EPS (ttm)", href: `${base}/earnings`, value: withYoy(formatMoney(ttm?.epsDiluted ?? ttm?.eps, currency), ttmYoy?.eps ?? growth?.growthEPSDiluted ?? growth?.growthEPS) },
        { label: "PE Ratio", href: `${base}/pe-ratio`, value: formatRatio(pe) },
        { label: "PEG Ratio", href: `${base}/peg-ratio`, value: formatRatio(peg) },
        { label: "PS Ratio", href: `${base}/ps-ratio`, value: formatRatio(typeof ratios?.priceToSalesRatioTTM === "number" ? ratios.priceToSalesRatioTTM : null) },
        { label: "PB Ratio", href: `${base}/pb-ratio`, value: formatRatio(typeof ratios?.priceToBookRatioTTM === "number" ? ratios.priceToBookRatioTTM : null) },
        { label: "Forward PE", value: formatRatio(forwardPe) },
        { label: "Dividend", href: `${base}/dividend`, value: dividendValue },
        { label: "Ex-Dividend Date", value: formatDate(dividend?.date) },
        { label: "Volume", value: formatInteger(quote?.volume ?? profile?.volume) },
        { label: "Average Volume", value: formatInteger(quote?.avgVolume ?? profile?.averageVolume) },
        { label: "Open", value: px(quote?.open) },
        { label: "Previous Close", value: px(quote?.previousClose) },
        { label: "Day's Range", value: quote ? `${px(quote.dayLow)} - ${px(quote.dayHigh)}` : "—" },
        { label: "52-Week Range", value: quote ? `${px(quote.yearLow)} - ${px(quote.yearHigh)}` : rangeLabel(profile?.range) },
        { label: "Beta", value: formatRatio(profile?.beta) },
        { label: "50-Day Average", value: px(quote?.priceAvg50) },
        { label: "200-Day Average", value: px(quote?.priceAvg200) },
        { label: "Profit Margin", value: formatPercentPlain(typeof ratios?.netProfitMarginTTM === "number" ? ratios.netProfitMarginTTM : null) },
        { label: "Analysts", href: `${base}/ratings`, value: formatAnalystConsensus(grades) },
        {
          label: "Price Target",
          href: `${base}/forecast`,
          value: target?.targetConsensus
            ? `${px(target.targetConsensus)}${upside != null ? ` (${upside > 0 ? "+" : ""}${upside.toFixed(1)}%)` : ""}`
            : "—",
        },
        {
          label: "DCF Fair Value",
          href: `${base}/forecast`,
          value:
            dcf != null
              ? `${px(dcf)}${dcfUpside != null ? ` (${dcfUpside > 0 ? "+" : ""}${dcfUpside.toFixed(1)}%)` : ""}`
              : "—",
        },
        { label: "FMP Rating", href: `${base}/forecast`, value: ratings?.rating ?? "—" },
        { label: "Altman Z-Score", href: `${base}/statistics`, value: formatNumber(scores?.altmanZScore) },
        {
          label: "Piotroski Score",
          href: `${base}/statistics`,
          value: scores?.piotroskiScore == null ? "—" : `${scores.piotroskiScore} / 9`,
        },
        {
          label: "Earnings Date",
          href: `${base}/earnings`,
          value: withYoy(formatDate(earningsDate), earningsSurprise),
        },
        ...(nextEarningsDate
          ? [{ label: "Next Earnings", href: `${base}/earnings`, value: formatDate(nextEarningsDate) }]
          : []),
      ]}
    />
  );
}
