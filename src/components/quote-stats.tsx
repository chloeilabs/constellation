import type { ReactNode } from "react";
import { formatCompactUsd, formatDate, formatInteger, formatPrice, formatRatio, rangeLabel } from "@/lib/format";
import type { FmpDividend, FmpGradesConsensus, FmpIncomeStatement, FmpPriceTarget, FmpProfile, FmpQuote, FmpRatiosTtm } from "@/lib/types";

export function StatGrid({
  items,
}: {
  items: { label: string; value: ReactNode }[];
}) {
  return (
    <dl className="grid grid-cols-1 overflow-hidden rounded-lg border border-border sm:grid-cols-2">
      {items.map((item) => (
        <div key={item.label} className="flex items-center justify-between gap-4 border-b border-border px-3 py-2 last:border-b-0 sm:odd:border-r">
          <dt className="text-sm text-muted">{item.label}</dt>
          <dd className="tabular text-sm font-medium">{item.value}</dd>
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
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <StatGrid
        items={[
          { label: "Market Cap", value: formatCompactUsd(quote?.marketCap ?? profile?.marketCap) },
          { label: "Revenue (ttm)", value: formatCompactUsd(ttm?.revenue) },
          { label: "Net Income (ttm)", value: formatCompactUsd(ttm?.netIncome) },
          { label: "EPS (ttm)", value: formatPrice(ttm?.epsDiluted ?? ttm?.eps) },
          { label: "Shares Out", value: formatCompactUsd(ttm?.weightedAverageShsOutDil).replace("$", "") },
          { label: "PE Ratio", value: formatRatio(typeof pe === "number" ? pe : null) },
          { label: "Dividend", value: dividend ? `$${formatPrice(dividend.dividend)}` : profile?.lastDividend ? `$${formatPrice(profile.lastDividend)}` : "—" },
          { label: "Ex-Dividend Date", value: formatDate(dividend?.date) },
        ]}
      />
      <StatGrid
        items={[
          { label: "Volume", value: formatInteger(quote?.volume ?? profile?.volume) },
          { label: "Open", value: formatPrice(quote?.open) },
          { label: "Previous Close", value: formatPrice(quote?.previousClose) },
          { label: "Day's Range", value: quote ? `${formatPrice(quote.dayLow)} - ${formatPrice(quote.dayHigh)}` : "—" },
          { label: "52-Week Range", value: quote ? `${formatPrice(quote.yearLow)} - ${formatPrice(quote.yearHigh)}` : rangeLabel(profile?.range) },
          { label: "Beta", value: formatRatio(profile?.beta) },
          { label: "Analysts", value: grades?.consensus ?? "—" },
          {
            label: "Price Target",
            value: target?.targetConsensus
              ? `${formatPrice(target.targetConsensus)}${quote?.price ? ` (${(((target.targetConsensus - quote.price) / quote.price) * 100).toFixed(2)}%)` : ""}`
              : "—",
          },
        ]}
      />
    </div>
  );
}
