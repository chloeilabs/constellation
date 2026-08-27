import Link from "next/link";
import { ChangePercent } from "@/components/change";
import { formatPrice } from "@/lib/format";
import { INDEX_LABELS } from "@/lib/statements";
import type { FmpQuote } from "@/lib/types";

export function IndexTicker({ quotes }: { quotes: FmpQuote[] }) {
  if (quotes.length === 0) return null;
  return (
    <div className="border-b border-border bg-muted-bg">
      <div className="mx-auto flex max-w-7xl gap-6 overflow-x-auto px-4 py-2 text-sm">
        {quotes.map((quote) => (
          <Link
            key={quote.symbol}
            href={`/stocks/${encodeURIComponent(quote.symbol)}`}
            className="flex shrink-0 items-baseline gap-2"
          >
            <span className="font-medium text-header">{INDEX_LABELS[quote.symbol] ?? quote.name}</span>
            <span className="tabular">{formatPrice(quote.price)}</span>
            <ChangePercent value={quote.changePercentage} />
          </Link>
        ))}
      </div>
    </div>
  );
}
