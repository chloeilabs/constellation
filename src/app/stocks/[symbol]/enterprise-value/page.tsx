import { Container } from "@/components/container";
import { PageHeader, PeriodToggle } from "@/components/page-header";
import { SectionNav } from "@/components/section-nav";
import { quoteFundamentalsNav } from "@/lib/nav";
import { MetricCards } from "@/components/metric-cards";
import { HistoryBars } from "@/components/history-bars";
import { ChangePercent } from "@/components/change";
import { compactMoneyFn, formatDate, formatMoney, yearOverYear } from "@/lib/format";
import { getEnterpriseValues, getIncomeTtm, getProfile, getQuote } from "@/lib/fmp";

export default async function EnterpriseValuePage({
  params,
  searchParams,
}: {
  params: Promise<{ symbol: string }>;
  searchParams: Promise<{ period?: string }>;
}) {
  const { symbol } = await params;
  const { period: periodParam } = await searchParams;
  const ticker = symbol.toUpperCase();
  const period = periodParam === "quarter" ? "quarter" : "annual";
  const [history, ttm, quote, profile] = await Promise.all([
    getEnterpriseValues(ticker, period, 20),
    getIncomeTtm(ticker),
    getQuote(ticker),
    getProfile(ticker),
  ]);
  const money = compactMoneyFn(profile?.currency);
  const px = (value: number | null | undefined) => formatMoney(value, profile?.currency);
  const latest = history[0];
  const prior = history[1];
  const growth = yearOverYear(latest?.enterpriseValue, prior?.enterpriseValue);
  const evSales = latest?.enterpriseValue && ttm?.revenue ? latest.enterpriseValue / ttm.revenue : null;
  const netDebt =
    latest ? latest.addTotalDebt - latest.minusCashAndCashEquivalents : null;
  const chartItems = [...history]
    .reverse()
    .filter((row) => typeof row.enterpriseValue === "number")
    .map((row) => ({
      label: period === "quarter" ? row.date.slice(0, 7) : row.date.slice(0, 4),
      value: row.enterpriseValue,
    }));

  return (
    <Container>
      <PageHeader
        title={`${ticker} Enterprise Value`}
        description="Market cap plus debt, minus cash — the total value of the operating business."
      />
      <SectionNav items={quoteFundamentalsNav(ticker)} />
      <div className="mb-6">
        <PeriodToggle
          period={period}
          annualHref={`/stocks/${ticker}/enterprise-value`}
          quarterHref={`/stocks/${ticker}/enterprise-value?period=quarter`}
        />
      </div>
      <MetricCards
        items={[
          { label: "Enterprise Value", value: money(latest?.enterpriseValue) },
          { label: "Market Cap", value: money(latest?.marketCapitalization ?? quote?.marketCap) },
          { label: "Total Debt", value: money(latest?.addTotalDebt) },
          { label: "Cash", value: money(latest?.minusCashAndCashEquivalents) },
          { label: "Net Debt", value: money(netDebt) },
          { label: "EV / Sales", value: evSales == null ? "—" : evSales.toFixed(2) },
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
                <th className="num">Cash</th>
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
                      <td className="num">{px(row.stockPrice)}</td>
                      <td className="num">{money(row.marketCapitalization)}</td>
                      <td className="num">{money(row.addTotalDebt)}</td>
                      <td className="num">{money(row.minusCashAndCashEquivalents)}</td>
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
    </Container>
  );
}
