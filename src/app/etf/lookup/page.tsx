import Link from "next/link";
import { Container } from "@/components/container";
import { PageHeader } from "@/components/page-header";
import { SectionNav } from "@/components/section-nav";
import { formatCompactUsd, formatInteger, formatPercentPlain } from "@/lib/format";
import { getEtfAssetExposure, getQuote, listedUsEtfHolders } from "@/lib/fmp";
import { decodeTicker, quoteHref } from "@/lib/listings";
import { ETF_NAV } from "@/lib/nav";

const EXAMPLES = ["AAPL", "MSFT", "NVDA", "JPM", "XOM"] as const;

export async function generateMetadata({ searchParams }: { searchParams: Promise<{ symbol?: string }> }) {
  const ticker = decodeTicker((await searchParams).symbol ?? "");
  return {
    title: ticker ? `${ticker} ETF Holdings Lookup` : "Reverse ETF Lookup",
    description: "Find U.S. ETFs that report a stock as a holding, using live FMP asset-exposure data.",
  };
}

export default async function EtfLookupPage({
  searchParams,
}: {
  searchParams: Promise<{ symbol?: string }>;
}) {
  const raw = (await searchParams).symbol ?? "";
  const ticker = raw.trim() ? decodeTicker(raw) : "";
  const [quote, exposure] = ticker
    ? await Promise.all([getQuote(ticker), getEtfAssetExposure(ticker)])
    : [null, []];
  const ranked = (await listedUsEtfHolders(exposure))
    .slice()
    .sort((a, b) => (b.marketValue ?? 0) - (a.marketValue ?? 0));
  const total = ranked.length;
  const holders = ranked.slice(0, 200);
  const name = quote?.name || ticker;

  return (
    <Container>
      <PageHeader
        title="Reverse ETF Lookup"
        description="See which U.S. ETFs report a stock as a holding, ranked by the market value of that position from FMP."
      />
      <SectionNav items={ETF_NAV} />
      <form className="mb-6 grid grid-cols-1 gap-3 rounded-lg border border-border bg-muted-bg p-4 sm:flex sm:flex-wrap sm:items-end">
        <label className="min-w-0 text-sm sm:w-auto">
          <span className="mb-1 block text-muted">Stock symbol</span>
          <input
            name="symbol"
            defaultValue={ticker}
            placeholder="AAPL"
            className="sa-input w-full uppercase sm:w-48"
            autoCapitalize="characters"
          />
        </label>
        <button type="submit" className="sa-btn sa-btn-primary">
          Look up
        </button>
        <p className="text-sm text-muted">
          Try{" "}
          {EXAMPLES.map((symbol, index) => (
            <span key={symbol}>
              {index > 0 ? ", " : null}
              <Link href={`/etf/lookup?symbol=${symbol}`} className="text-link hover:underline">
                {symbol}
              </Link>
            </span>
          ))}
        </p>
      </form>

      {ticker ? (
        <>
          <p className="mb-3 text-sm text-muted">
            {total} ETF{total === 1 ? "" : "s"} report{" "}
            <Link href={quoteHref(ticker, { name })} className="text-link hover:underline">
              {name} ({ticker})
            </Link>{" "}
            as a holding
            {total > holders.length ? ` (showing the largest ${holders.length} by position value)` : ""}.
          </p>
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="sa-table">
              <thead>
                <tr>
                  <th>ETF</th>
                  <th className="num">Weight</th>
                  <th className="num">Shares</th>
                  <th className="num">Market Value</th>
                </tr>
              </thead>
              <tbody>
                {holders.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-muted">
                      No U.S. ETFs report this symbol as a holding in FMP’s asset-exposure file.
                    </td>
                  </tr>
                ) : (
                  holders.map((row) => (
                    <tr key={row.symbol}>
                      <td className="symbol">
                        <Link href={`/etf/${row.symbol}`} className="text-link hover:underline">
                          {row.symbol}
                        </Link>
                      </td>
                      <td className="num">{formatPercentPlain(row.weightPercentage, { alreadyPercent: true })}</td>
                      <td className="num">{formatInteger(row.sharesNumber)}</td>
                      <td className="num">{formatCompactUsd(row.marketValue)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <p className="text-sm text-muted">Enter a stock symbol to list ETFs that hold it.</p>
      )}
    </Container>
  );
}
