import { Container } from "@/components/container";
import { PageHeader, PeriodToggle } from "@/components/page-header";
import { SectionNav } from "@/components/section-nav";
import { quoteFundamentalsNav } from "@/lib/nav";
import { MetricCards } from "@/components/metric-cards";
import { HistoryBars } from "@/components/history-bars";
import { ChangePercent } from "@/components/change";
import { compactMoneyFn, formatDate, formatMoney, formatRatio, yearOverYear } from "@/lib/format";
import { getProfile } from "@/lib/fmp";
import { historyLabel, loadLiveValuation, loadPeriodValuationHistory } from "@/lib/period-valuation";
import { decodeTicker, stockPath } from "@/lib/listings";
import { filingLimit } from "@/lib/statements";

function cashInvestments(row: { cashAndInvestments?: number | null; netCash?: number | null; totalDebt?: number | null }) {
  if (row.cashAndInvestments != null) return row.cashAndInvestments;
  if (row.netCash != null && row.totalDebt != null) return row.netCash + row.totalDebt;
  return null;
}

export default async function EnterpriseValuePage({
  params,
  searchParams,
}: {
  params: Promise<{ symbol: string }>;
  searchParams: Promise<{ period?: string }>;
}) {
  const { symbol } = await params;
  const { period: periodParam } = await searchParams;
  const ticker = decodeTicker(symbol);
  const period = periodParam === "quarter" ? "quarter" : "annual";
  const [live, history, profile] = await Promise.all([
    loadLiveValuation(ticker),
    loadPeriodValuationHistory(ticker, period, filingLimit(period)),
    getProfile(ticker),
  ]);
  const money = compactMoneyFn(profile?.currency);
  const px = (value: number | null | undefined) => formatMoney(value, profile?.currency);
  const liveCash = cashInvestments(live);
  const netDebt = live.netCash != null ? -live.netCash : null;
  const latest = history[0];
  const prior = history[1];
  const growth = yearOverYear(latest?.enterpriseValue, prior?.enterpriseValue);
  const chartItems = [...history]
    .reverse()
    .filter((row) => typeof row.enterpriseValue === "number")
    .map((row) => ({
      label: historyLabel(row, period),
      value: row.enterpriseValue as number,
    }));
  const evHref = stockPath(ticker, "/enterprise-value");

  return (
    <Container>
      <PageHeader
        title={`${ticker} Enterprise Value`}
        description="Market cap minus net cash. Cash includes marketable securities and long-term investments. Fiscal history uses the last FMP close on or before each period end."
      />
      <SectionNav items={quoteFundamentalsNav(ticker)} />
      <div className="mb-6">
        <PeriodToggle
          period={period}
          annualHref={evHref}
          quarterHref={`${evHref}?period=quarter`}
        />
      </div>
      <MetricCards
        items={[
          { label: "Enterprise Value", value: money(live.enterpriseValue) },
          { label: "Market Cap", href: stockPath(ticker, "/market-cap"), value: money(live.marketCap) },
          { label: "Total Debt", value: money(live.totalDebt) },
          { label: "Cash & Investments", value: money(liveCash) },
          { label: "Net Cash", href: stockPath(ticker, "/net-cash"), value: money(live.netCash) },
          { label: "Net Debt", value: money(netDebt) },
          { label: "EV / Sales", href: stockPath(ticker, "/ev-sales"), value: formatRatio(live.evToSales) },
          { label: "EV / EBITDA", href: stockPath(ticker, "/ev-ebitda"), value: formatRatio(live.evToEBITDA) },
          { label: "EV / EBIT", href: stockPath(ticker, "/ev-ebit"), value: formatRatio(live.evToEBIT) },
          { label: "EV / Earnings", href: stockPath(ticker, "/ev-earnings"), value: formatRatio(live.evToEarnings) },
          { label: "EV / FCF", href: stockPath(ticker, "/ev-fcf"), value: formatRatio(live.evToFreeCashFlow) },
        ]}
      />
      {chartItems.length > 1 ? (
        <section className="mt-10">
          <h2 className="mb-3 text-lg font-semibold text-header">Enterprise Value Chart</h2>
          <HistoryBars items={chartItems} formatValue={money} />
        </section>
      ) : null}
      <section className="mt-10">
        <h2 className="mb-3 text-lg font-semibold text-header">
          {period === "quarter" ? "Quarterly" : "Annual"} Enterprise Value
        </h2>
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="sa-table">
            <thead>
              <tr>
                <th>Date</th>
                <th className="num">Stock Price</th>
                <th className="num">Market Cap</th>
                <th className="num">Debt</th>
                <th className="num">Cash & Investments</th>
                <th className="num">Enterprise Value</th>
                <th className="num">Change</th>
              </tr>
            </thead>
            <tbody>
              {history.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-muted">
                    No enterprise value history available.
                  </td>
                </tr>
              ) : (
                history.map((row, index) => {
                  const previous = history[index + 1];
                  const yoy = yearOverYear(row.enterpriseValue, previous?.enterpriseValue);
                  return (
                    <tr key={row.date}>
                      <td>{formatDate(row.date)}</td>
                      <td className="num">{px(row.lastClosePrice)}</td>
                      <td className="num">{money(row.marketCap)}</td>
                      <td className="num">{money(row.totalDebt)}</td>
                      <td className="num">{money(cashInvestments(row))}</td>
                      <td className="num">{money(row.enterpriseValue)}</td>
                      <td className="num">
                        <ChangePercent value={index === 0 ? growth : yoy} alreadyPercent={false} />
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
        Enterprise value is market cap minus net cash, so cash includes marketable securities.{" "}
        <span className="text-header">Formula: EV = Market Cap − (Cash & Investments − Total Debt)</span>
      </p>
    </Container>
  );
}
