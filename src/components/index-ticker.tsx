import Link from "next/link";
import { ChangePercent } from "@/components/change";
import { formatClock, formatPrice } from "@/lib/format";
import { stockPath } from "@/lib/listings";
import { INDEX_LABELS } from "@/lib/statements";
import type { FmpMarketHours, FmpQuote } from "@/lib/types";

export function IndexTicker({
  quotes,
  hours,
}: {
  quotes: FmpQuote[];
  hours?: FmpMarketHours | null;
}) {
  if (quotes.length === 0 && !hours) return null;
  return (
    <div className="border-b border-border bg-muted-bg">
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-2 text-sm">
        <div className="flex min-w-0 flex-1 gap-6 overflow-x-auto">
          {quotes.map((quote) => (
            <Link
              key={quote.symbol}
              href={stockPath(quote.symbol)}
              className="flex shrink-0 items-baseline gap-2"
            >
              <span className="font-medium text-header">{INDEX_LABELS[quote.symbol] ?? quote.name}</span>
              <span className="tabular">{formatPrice(quote.price)}</span>
              <ChangePercent value={quote.changePercentage} />
            </Link>
          ))}
        </div>
        {hours ? (
          <p className="hidden shrink-0 text-xs text-muted md:block">
            <span className={hours.isMarketOpen ? "font-semibold text-gain" : "font-semibold text-header"}>
              {hours.name} {hours.isMarketOpen ? "Open" : "Closed"}
            </span>
            <span className="ml-2">
              {formatClock(hours.openingHour)} – {formatClock(hours.closingHour)} ET
            </span>
          </p>
        ) : null}
      </div>
    </div>
  );
}
