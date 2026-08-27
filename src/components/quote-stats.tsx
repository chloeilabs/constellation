import type { ReactNode } from "react";
import Link from "next/link";
import { ChangePercent } from "@/components/change";
import {
  formatCompactUsd,
  formatDate,
  formatInteger,
  formatPercentPlain,
  formatPrice,
  formatRatio,
  rangeLabel,
} from "@/lib/format";
import type {
  FmpDividend,
  FmpGradesConsensus,
  FmpIncomeGrowth,
  FmpIncomeStatement,
  FmpPriceTarget,
  FmpProfile,
  FmpQuote,
  FmpRatiosTtm,
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
}) {
  const pe = ratios?.priceToEarningsRatioTTM;
  const upside =
    target?.targetConsensus && quote?.price
      ? ((target.targetConsensus - quote.price) / quote.price) * 100
      : null;
  const base = `/stocks/${symbol}`;

  return (
    <StatGrid
      items={[
        { label: "Market Cap", href: `${base}/market-cap`, value: formatCompactUsd(quote?.marketCap ?? profile?.marketCap) },
        { label: "Revenue (ttm)", href: `${base}/revenue`, value: withYoy(formatCompactUsd(ttm?.revenue), growth?.growthRevenue) },
        { label: "Net Income (ttm)", href: `${base}/net-income`, value: withYoy(formatCompactUsd(ttm?.netIncome), growth?.growthNetIncome) },
        { label: "Shares Out", value: formatCompactUsd(ttm?.weightedAverageShsOutDil).replace("$", "") },
        { label: "EPS (ttm)", href: `${base}/earnings`, value: withYoy(formatPrice(ttm?.epsDiluted ?? ttm?.eps), growth?.growthEPSDiluted ?? growth?.growthEPS) },
        { label: "PE Ratio", href: `${base}/pe-ratio`, value: formatRatio(typeof pe === "number" ? pe : null) },
        {
          label: "Dividend Yield",
          value: formatPercentPlain(typeof ratios?.dividendYieldTTM === "number" ? ratios.dividendYieldTTM : null),
        },
        { label: "Dividend", value: dividend ? `$${formatPrice(dividend.dividend)}` : profile?.lastDividend ? `$${formatPrice(profile.lastDividend)}` : "—" },
        { label: "Ex-Dividend Date", value: formatDate(dividend?.date) },
        { label: "Volume", value: formatInteger(quote?.volume ?? profile?.volume) },
        { label: "Average Volume", value: formatInteger(profile?.averageVolume) },
        { label: "Open", value: formatPrice(quote?.open) },
        { label: "Previous Close", value: formatPrice(quote?.previousClose) },
        { label: "Day's Range", value: quote ? `${formatPrice(quote.dayLow)} - ${formatPrice(quote.dayHigh)}` : "—" },
        { label: "52-Week Range", value: quote ? `${formatPrice(quote.yearLow)} - ${formatPrice(quote.yearHigh)}` : rangeLabel(profile?.range) },
        { label: "Beta", value: formatRatio(profile?.beta) },
        { label: "50-Day Average", value: formatPrice(quote?.priceAvg50) },
        { label: "200-Day Average", value: formatPrice(quote?.priceAvg200) },
        { label: "Profit Margin", value: formatPercentPlain(typeof ratios?.netProfitMarginTTM === "number" ? ratios.netProfitMarginTTM : null) },
        { label: "Analysts", value: grades?.consensus ?? "—" },
        {
          label: "Price Target",
          value: target?.targetConsensus
            ? `${formatPrice(target.targetConsensus)}${upside != null ? ` (${upside > 0 ? "+" : ""}${upside.toFixed(1)}%)` : ""}`
            : "—",
        },
        { label: "Earnings Date", value: formatDate(earningsDate) },
      ]}
    />
  );
}
