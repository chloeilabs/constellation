import type { ReactNode } from "react";
import Link from "next/link";
import { ChangePercent } from "@/components/change";
import {
  formatCompact,
  formatCompactMoney,
  formatDate,
  formatInteger,
  formatMoney,
  formatPercentPlain,
  formatRatio,
  rangeLabel,
} from "@/lib/format";
import { stockPath } from "@/lib/listings";
import { cn, indicatedAnnualDividend } from "@/lib/utils";
import type {
  FmpDividend,
  FmpGradesConsensus,
  FmpIncomeStatement,
  FmpPriceTarget,
  FmpProfile,
  FmpQuote,
} from "@/lib/types";

function withYoy(value: ReactNode, yoy: number | null | undefined) {
  return (
    <span className="inline-flex items-center gap-2">
      {value}
      {typeof yoy === "number" ? <ChangePercent value={yoy} alreadyPercent={false} className="text-xs" /> : null}
    </span>
  );
}

function StatList({
  items,
  className,
}: {
  items: { label: string; value: ReactNode; href?: string }[];
  className?: string;
}) {
  return (
    <dl className={className}>
      {items.map((item) => (
        <div
          key={item.label}
          className="flex items-center justify-between gap-3 border-b border-border px-3 py-1.5 last:border-b-0"
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
  target,
  grades,
  dividend,
  earningsDate,
  forwardPe,
  marketCapYoy,
  sharesOutstanding,
  ttmYoy,
  pe,
}: {
  symbol: string;
  quote: FmpQuote | null;
  profile: FmpProfile | null;
  ttm: FmpIncomeStatement | null;
  target: FmpPriceTarget | null;
  grades: FmpGradesConsensus | null;
  dividend: FmpDividend | null;
  earningsDate?: string | null;
  forwardPe?: number | null;
  marketCapYoy?: number | null;
  sharesOutstanding?: number | null;
  pe?: number | null;
  ttmYoy?: {
    revenue?: number | null;
    netIncome?: number | null;
    eps?: number | null;
  } | null;
}) {
  const currency = profile?.currency || "USD";
  const money = (value: number | null | undefined) => formatCompactMoney(value, currency);
  const px = (value: number | null | undefined) => formatMoney(value, currency);
  const eps = ttm?.epsDiluted ?? ttm?.eps;
  const impliedPe = quote?.price && eps && eps > 0 ? quote.price / eps : null;
  const peValue = pe ?? impliedPe ?? quote?.pe ?? null;
  const upside =
    target?.targetConsensus && quote?.price
      ? ((target.targetConsensus - quote.price) / quote.price) * 100
      : null;
  const base = stockPath(symbol);
  const annualDividend = indicatedAnnualDividend(dividend, profile?.lastDividend);
  const dividendYield =
    annualDividend != null && quote?.price && quote.price > 0 ? annualDividend / quote.price : null;
  const dividendValue =
    annualDividend != null
      ? `${px(annualDividend)}${dividendYield != null ? ` (${formatPercentPlain(dividendYield)})` : ""}`
      : "—";

  const left = [
    { label: "Market Cap", href: `${base}/market-cap`, value: withYoy(money(quote?.marketCap ?? profile?.marketCap), marketCapYoy) },
    { label: "Revenue (ttm)", href: `${base}/revenue`, value: withYoy(money(ttm?.revenue), ttmYoy?.revenue) },
    { label: "Net Income", href: `${base}/net-income`, value: withYoy(money(ttm?.netIncome), ttmYoy?.netIncome) },
    { label: "Shares Out", href: `${base}/shares`, value: formatCompact(sharesOutstanding ?? ttm?.weightedAverageShsOutDil) },
    { label: "EPS", href: `${base}/earnings`, value: withYoy(formatMoney(eps, currency), ttmYoy?.eps) },
    { label: "PE Ratio", href: `${base}/pe-ratio`, value: formatRatio(peValue) },
    { label: "Forward PE", href: `${base}/forward-pe`, value: formatRatio(forwardPe) },
    { label: "Dividend", href: `${base}/dividend`, value: dividendValue },
    { label: "Ex-Dividend Date", value: formatDate(dividend?.date) },
  ];
  const right = [
    { label: "Volume", value: formatInteger(quote?.volume ?? profile?.volume) },
    { label: "Open", value: px(quote?.open) },
    { label: "Previous Close", value: px(quote?.previousClose) },
    { label: "Day's Range", value: quote ? `${px(quote.dayLow)} - ${px(quote.dayHigh)}` : "—" },
    { label: "52-Week Range", value: quote ? `${px(quote.yearLow)} - ${px(quote.yearHigh)}` : rangeLabel(profile?.range) },
    { label: "Beta", value: formatRatio(profile?.beta) },
    { label: "Analysts", href: `${base}/ratings`, value: grades?.consensus ?? "—" },
    {
      label: "Price Target",
      href: `${base}/forecast`,
      value: target?.targetConsensus
        ? `${px(target.targetConsensus)}${upside != null ? ` (${upside > 0 ? "+" : ""}${upside.toFixed(2)}%)` : ""}`
        : "—",
    },
    { label: "Earnings Date", href: `${base}/earnings`, value: formatDate(earningsDate) },
  ];

  return (
    <div className="grid grid-cols-1 overflow-hidden rounded-lg border border-border sm:grid-cols-2">
      <StatList items={left} />
      <StatList items={right} className={cn("sm:border-l sm:border-border")} />
    </div>
  );
}
