import Link from "next/link";
import { ChangePercent } from "@/components/change";
import { formatClock, formatPrice } from "@/lib/format";
import { stockPath } from "@/lib/listings";
import { INDEX_LABELS } from "@/lib/statements";
import type { FmpMarketHours, FmpQuote } from "@/lib/types";

function sessionHours(hours: { openingHour: string; closingHour: string }) {
  const open = formatClock(hours.openingHour);
  const close = formatClock(hours.closingHour);
  const usable = (value: string) => /\d/.test(value) && !/closed/i.test(value);
  if (!usable(open) || !usable(close)) return null;
  return `${open} – ${close} ET`;
}

export function IndexTicker({
  quotes,
  hours,
}: {
  quotes: FmpQuote[];
  hours?: FmpMarketHours | null;
}) {
  if (quotes.length === 0 && !hours) return null;
  const hoursLabel = hours ? sessionHours(hours) : null;
  return (
    <div className="border-b border-border bg-muted-bg">
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-2 text-sm">
        <div className="relative min-w-0 flex-1">
          <div className="sa-scroll flex gap-6 pr-8" aria-label="Index quotes">
            {quotes.map((quote) => (
              <Link
                key={quote.symbol}
                href={stockPath(quote.symbol)}
                className="flex shrink-0 items-baseline gap-2 rounded-sm hover:text-brand"
              >
                <span className="font-medium text-header">{INDEX_LABELS[quote.symbol] ?? quote.name}</span>
                <span className="tabular">{formatPrice(quote.price)}</span>
                <ChangePercent value={quote.changePercentage} />
              </Link>
            ))}
          </div>
          <div
            className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-muted-bg"
            aria-hidden="true"
          />
        </div>
        {hours ? (
          <>
            <p
              className={`shrink-0 text-xs font-semibold md:hidden ${hours.isMarketOpen ? "text-gain" : "text-header"}`}
            >
              {hours.isMarketOpen ? "Open" : "Closed"}
            </p>
            <p className="hidden shrink-0 text-xs text-muted md:block">
              <span className={hours.isMarketOpen ? "font-semibold text-gain" : "font-semibold text-header"}>
                {hours.name} {hours.isMarketOpen ? "Open" : "Closed"}
              </span>
              {hoursLabel ? <span className="ml-2">{hoursLabel}</span> : null}
            </p>
          </>
        ) : null}
      </div>
    </div>
  );
}
