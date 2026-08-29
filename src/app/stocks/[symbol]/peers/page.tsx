import Link from "next/link";
import { Container } from "@/components/container";
import { PageHeader } from "@/components/page-header";
import { SectionNav } from "@/components/section-nav";
import { quoteFundamentalsNav } from "@/lib/nav";
import { ChangePercent } from "@/components/change";
import { currencyForSymbol, formatCompactUsd, formatPercentPlain, formatPlausiblePe, formatPrice, formatRatio } from "@/lib/format";
import { getBalanceSheets, getIncomeTtm, getPeers, getProfile, getQuote, withQuoteChanges } from "@/lib/fmp";
import { decodeTicker, quoteHref, stockPath } from "@/lib/listings";
import { compareHref, listedPeers } from "@/lib/peers";
import { multiplesFromFilings } from "@/lib/valuation";

function num(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

export default async function PeersPage({ params }: { params: Promise<{ symbol: string }> }) {
  const { symbol } = await params;
  const ticker = decodeTicker(symbol);
  const [quote, profile, peers] = await Promise.all([getQuote(ticker), getProfile(ticker), getPeers(ticker)]);
  const peerList = listedPeers(peers, ticker, 12);
  const subject = {
    symbol: ticker,
    companyName: profile?.companyName ?? ticker,
    price: quote?.price,
    mktCap: quote?.marketCap ?? profile?.marketCap ?? 0,
  };
  const compareSet = [subject, ...peerList];
  const [rows, peerFundamentals] = await Promise.all([
    withQuoteChanges(compareSet),
    Promise.all(
      compareSet.map(async (row) => {
        const [income, sheets] = await Promise.all([
          getIncomeTtm(row.symbol),
          getBalanceSheets(row.symbol, "quarter", 1),
        ]);
        return multiplesFromFilings({
          price: row.price,
          marketCap: row.mktCap,
          revenue: income?.revenue,
          netIncome: income?.netIncome,
          eps: income?.epsDiluted ?? income?.eps,
          equity: sheets[0]?.totalStockholdersEquity,
        });
      }),
    ),
  ]);
  const compareSymbols = rows.map((row) => row.symbol);

  return (
    <Container>
      <PageHeader
        title={`${ticker} Peers`}
        description="Live FMP stock peers with trailing valuation and profitability, excluding names under $1B market cap."
        actions={
          compareSymbols.length > 1 ? (
            <Link
              href={compareHref(compareSymbols)}
              className="inline-flex items-center rounded-md border border-border-strong px-3 py-1.5 text-sm font-medium hover:bg-muted-bg"
            >
              Compare
            </Link>
          ) : null
        }
      />
      <SectionNav items={quoteFundamentalsNav(ticker)} />
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="sa-table">
          <thead>
            <tr>
              <th>Symbol</th>
              <th>Company</th>
              <th className="num">Price</th>
              <th className="num">Change</th>
              <th className="num">PE</th>
              <th className="num">PS</th>
              <th className="num">PB</th>
              <th className="num">Profit Margin</th>
              <th className="num">Market Cap</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={9} className="text-muted">
                  No peers available.
                </td>
              </tr>
            ) : (
              rows.map((row, index) => {
                const multiples = peerFundamentals[index];
                const isSubject = row.symbol.toUpperCase() === ticker;
                return (
                  <tr key={row.symbol} className={isSubject ? "bg-muted-bg/60 font-medium" : undefined}>
                    <td className="symbol">
                      {isSubject ? (
                        <Link href={stockPath(ticker)} className="text-link hover:underline">
                          {row.symbol}
                        </Link>
                      ) : (
                        <Link href={quoteHref(row.symbol, { name: row.companyName })} className="text-link hover:underline">
                          {row.symbol}
                        </Link>
                      )}
                    </td>
                    <td className="max-w-[280px] truncate">{row.companyName}</td>
                    <td className="num">{formatPrice(row.price)}</td>
                    <td className="num">
                      <ChangePercent value={row.changePercentage} alreadyPercent />
                    </td>
                    <td className="num">{formatPlausiblePe(multiples?.pe ?? row.pe)}</td>
                    <td className="num">{formatRatio(num(multiples?.ps))}</td>
                    <td className="num">{formatRatio(num(multiples?.pb))}</td>
                    <td className="num">{formatPercentPlain(num(multiples?.profitMargin))}</td>
                    <td className="num">{formatCompactUsd(row.mktCap, currencyForSymbol(row.symbol))}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-sm text-muted">
        Peer set is FMP <span className="text-header">/stock-peers</span>. Tiny or illiquid names are dropped so the table
        stays comparable.{" "}
        {compareSymbols.length > 1 ? (
          <Link href={compareHref(compareSymbols)} className="text-link hover:underline">
            Open the full stock compare
          </Link>
        ) : null}
      </p>
    </Container>
  );
}
