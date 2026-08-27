import type { ReactNode } from "react";
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
  FmpIncomeStatement,
  FmpPriceTarget,
  FmpProfile,
  FmpQuote,
  FmpRatiosTtm,
} from "@/lib/types";

export function StatGrid({
  items,
}: {
  items: { label: string; value: ReactNode }[];
}) {
  return (
    <dl className="grid grid-cols-1 overflow-hidden rounded-lg border border-border sm:grid-cols-2">
      {items.map((item) => (
        <div
          key={item.label}
          className="flex items-center justify-between gap-3 border-b border-border px-3 py-1.5 last:border-b-0 sm:odd:border-r"
        >
          <dt className="text-[13px] text-muted">{item.label}</dt>
          <dd className="tabular text-[13px] font-medium">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function QuoteStats({
  quote,
  profile,
  ttm,
  ratios,
  target,
  grades,
  dividend,
}: {
  quote: FmpQuote | null;
  profile: FmpProfile | null;
  ttm: FmpIncomeStatement | null;
  ratios: FmpRatiosTtm | null;
  target: FmpPriceTarget | null;
  grades: FmpGradesConsensus | null;
  dividend: FmpDividend | null;
}) {
  const pe = ratios?.priceToEarningsRatioTTM;
  const upside =
    target?.targetConsensus && quote?.price
      ? ((target.targetConsensus - quote.price) / quote.price) * 100
      : null;

  return (
    <StatGrid
      items={[
        { label: "Market Cap", value: formatCompactUsd(quote?.marketCap ?? profile?.marketCap) },
        { label: "Revenue (ttm)", value: formatCompactUsd(ttm?.revenue) },
        { label: "Net Income (ttm)", value: formatCompactUsd(ttm?.netIncome) },
        { label: "Shares Out", value: formatCompactUsd(ttm?.weightedAverageShsOutDil).replace("$", "") },
        { label: "EPS (ttm)", value: formatPrice(ttm?.epsDiluted ?? ttm?.eps) },
        { label: "PE Ratio", value: formatRatio(typeof pe === "number" ? pe : null) },
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
      ]}
    />
  );
}
