import Link from "next/link";
import { Container } from "@/components/container";
import { ChangePercent } from "@/components/change";
import { PageHeader } from "@/components/page-header";
import { SectionNav } from "@/components/section-nav";
import { formatCompact, formatInteger, formatPrice } from "@/lib/format";
import { getBatchIndexQuotes, getIndexList } from "@/lib/fmp";
import { stockPath } from "@/lib/listings";
import { joinIndexQuotes } from "@/lib/markets";
import { MARKET_NAV } from "@/lib/nav";
import { percentFromPriceChange } from "@/lib/utils";

export const metadata = {
  title: "Stock Market Indexes",
  description: "Live quotes for global stock market indexes from Financial Modeling Prep.",
};

export default async function MarketIndexesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; exchange?: string }>;
}) {
  const { q, exchange } = await searchParams;
  const query = (q || "").trim().toLowerCase();
  const exchangeFilter = (exchange || "").trim().toUpperCase();
  const [list, quotes] = await Promise.all([getIndexList(), getBatchIndexQuotes()]);
  const joined = joinIndexQuotes(list, quotes);
  const exchanges = [...new Set(joined.map((row) => row.exchange).filter(Boolean))].sort();
  const rows = joined.filter((row) => {
    if (exchangeFilter && row.exchange.toUpperCase() !== exchangeFilter) return false;
    if (!query) return true;
    return `${row.symbol} ${row.name} ${row.exchange}`.toLowerCase().includes(query);
  });

  return (
    <Container>
      <PageHeader
        title="Stock Market Indexes"
        description="Major U.S. and international indexes with live FMP batch quotes. Click a symbol for the quote, chart, and history."
      />
      <SectionNav items={MARKET_NAV} />
      <form className="mb-6 flex flex-wrap items-end gap-3">
        <label className="text-sm">
          <span className="mb-1 block text-muted">Search</span>
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Nikkei, FTSE, S&P…"
            className="h-9 w-56 rounded-md border border-border px-2"
          />
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-muted">Exchange</span>
          <select name="exchange" defaultValue={exchangeFilter} className="h-9 rounded-md border border-border px-2">
            <option value="">All</option>
            {exchanges.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>
        <button type="submit" className="h-9 rounded-md bg-header px-4 text-sm font-medium text-white">
          Filter
        </button>
      </form>
      <p className="mb-3 text-sm text-muted">
        {formatInteger(rows.length)} indexes
        {exchangeFilter ? ` on ${exchangeFilter}` : ""}
      </p>
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="sa-table">
          <thead>
            <tr>
              <th>Symbol</th>
              <th>Name</th>
              <th>Exchange</th>
              <th className="num">Level</th>
              <th className="num">Change</th>
              <th className="num">% Change</th>
              <th className="num">Volume</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-muted">
                  No indexes match this filter.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.symbol}>
                  <td className="symbol font-semibold">
                    <Link href={stockPath(row.symbol)} className="text-link hover:underline">
                      {row.symbol}
                    </Link>
                  </td>
                  <td className="max-w-[280px] truncate">{row.name}</td>
                  <td className="text-muted">{row.exchange}</td>
                  <td className="num">{formatPrice(row.price, row.price != null && row.price < 10 ? 4 : 2)}</td>
                  <td className="num">{row.change == null ? "—" : formatPrice(row.change)}</td>
                  <td className="num">
                    <ChangePercent value={percentFromPriceChange(row.price, row.change)} alreadyPercent={false} />
                  </td>
                  <td className="num">{row.volume ? formatCompact(row.volume) : "—"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </Container>
  );
}
