import Link from "next/link";
import { ChangePercent } from "@/components/change";
import { formatPrice } from "@/lib/format";
import { quoteHref } from "@/lib/listings";
import { POPULAR_SYMBOLS } from "@/lib/fmp";
import type { FmpQuote } from "@/lib/types";

function quoteFor(symbol: string, bySymbol: Map<string, FmpQuote>) {
  return bySymbol.get(symbol.toUpperCase()) ?? bySymbol.get(symbol.replaceAll(".", "-").toUpperCase());
}

export function PopularStocks({ quotes }: { quotes: FmpQuote[] }) {
  const bySymbol = new Map(quotes.map((quote) => [quote.symbol.toUpperCase(), quote]));
  return (
    <div className="mt-8 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:justify-center">
      {POPULAR_SYMBOLS.map((symbol) => {
        const quote = quoteFor(symbol, bySymbol);
        return (
          <Link
            key={symbol}
            href={quoteHref(symbol, { name: quote?.name, exchange: quote?.exchange })}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-border bg-background px-3 py-1.5 text-sm transition-colors hover:border-border-strong hover:bg-muted-bg sm:w-auto"
          >
            <span className="font-semibold text-header">{symbol}</span>
            {quote?.price != null ? (
              <>
                <span className="tabular text-muted">{formatPrice(quote.price)}</span>
                <ChangePercent value={quote.changePercentage} className="text-xs" />
              </>
            ) : (
              <span className="text-muted">—</span>
            )}
          </Link>
        );
      })}
    </div>
  );
}
