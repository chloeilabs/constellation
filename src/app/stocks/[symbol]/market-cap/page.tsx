import { Container } from "@/components/container";
import { PageHeader } from "@/components/page-header";
import { SectionNav } from "@/components/section-nav";
import { quoteFundamentalsNav } from "@/lib/nav";
import { MetricCards } from "@/components/metric-cards";
import { HistoryBars } from "@/components/history-bars";
import { ChangePercent } from "@/components/change";
import { compactMoneyFn, formatDate, formatMoney } from "@/lib/format";
import { getHistoricalMarketCap, getProfile, getQuote } from "@/lib/fmp";
import { addDays, isoDate, nyDateString, yearEndSnapshots } from "@/lib/utils";
import { decodeTicker, stockPath } from "@/lib/listings";
import { loadLiveValuation } from "@/lib/period-valuation";

export default async function MarketCapPage({ params }: { params: Promise<{ symbol: string }> }) {
  const { symbol } = await params;
  const ticker = decodeTicker(symbol);
  const today = nyDateString();
  const [quote, profile, live, history] = await Promise.all([
    getQuote(ticker),
    getProfile(ticker),
    loadLiveValuation(ticker),
    getHistoricalMarketCap(ticker, 5000, "1970-01-01", today),
  ]);
  const money = compactMoneyFn(profile?.currency);
  const annual = yearEndSnapshots(history);
  const latest = history[0] ?? annual[0];
  const yearAgoDate = isoDate(addDays(new Date(`${today}T00:00:00Z`), -365));
  const yearAgo =
    history.find((row) => row.date <= yearAgoDate) ??
    [...history].reverse().find((row) => row.date.slice(0, 4) === String(Number(today.slice(0, 4)) - 1));
  const yoy =
    latest && yearAgo && yearAgo.marketCap
      ? (latest.marketCap - yearAgo.marketCap) / Math.abs(yearAgo.marketCap)
      : null;
  const chartItems = [...annual].reverse().slice(-16).map((row) => ({
    label: row.date.slice(0, 4),
    value: row.marketCap,
  }));

  return (
    <Container>
      <PageHeader
        title={`${ticker} Market Cap`}
        description="Historical market capitalization and net worth."
      />
      <SectionNav items={quoteFundamentalsNav(ticker)} />
      <MetricCards
        items={[
          { label: "Market Cap", value: money(quote?.marketCap ?? latest?.marketCap) },
          { label: "Enterprise Value", href: stockPath(ticker, "/enterprise-value"), value: money(live.enterpriseValue) },
          {
            label: "1-Year Change",
            value: yoy == null ? "—" : <ChangePercent value={yoy} alreadyPercent={false} className="text-2xl" />,
          },
          { label: "Stock Price", value: formatMoney(quote?.price, profile?.currency) },
        ]}
      />
      {chartItems.length > 1 ? (
        <section className="mt-10">
          <h2 className="mb-3 text-lg font-semibold text-header">Market Cap History</h2>
          <HistoryBars items={chartItems} formatValue={money} />
        </section>
      ) : null}
      <section className="mt-10">
        <h2 className="mb-3 text-lg font-semibold text-header">Annual Market Cap</h2>
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="sa-table">
            <thead>
              <tr>
                <th>Date</th>
                <th className="num">Market Cap</th>
                <th className="num">% Change</th>
              </tr>
            </thead>
            <tbody>
              {annual.length === 0 ? (
                <tr>
                  <td colSpan={3} className="text-muted">
                    No market cap history available.
                  </td>
                </tr>
              ) : (
                annual.map((row, index) => {
                  const prior = annual[index + 1];
                  const change =
                    prior && prior.marketCap ? (row.marketCap - prior.marketCap) / Math.abs(prior.marketCap) : null;
                  return (
                    <tr key={row.date}>
                      <td>{formatDate(row.date)}</td>
                      <td className="num">{money(row.marketCap)}</td>
                      <td className="num">
                        <ChangePercent value={change} alreadyPercent={false} />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>
      <p className="mt-4 text-sm text-muted">
        Market cap is stock price multiplied by shares outstanding.{" "}
        <span className="text-header">Formula: Market Cap = Price × Shares Outstanding</span>
      </p>
    </Container>
  );
}
