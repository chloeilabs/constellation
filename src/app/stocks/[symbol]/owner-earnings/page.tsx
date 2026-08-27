import { Container } from "@/components/container";
import { PageHeader } from "@/components/page-header";
import { SectionNav } from "@/components/section-nav";
import { quoteFundamentalsNav } from "@/lib/nav";
import { MetricCards } from "@/components/metric-cards";
import { MetricHistory } from "@/components/metric-history";
import { compactMoneyFn, formatMoney, reportingCurrency, yearOverYear } from "@/lib/format";
import { getOwnerEarnings, getQuote } from "@/lib/fmp";

export default async function OwnerEarningsPage({ params }: { params: Promise<{ symbol: string }> }) {
  const { symbol } = await params;
  const ticker = symbol.toUpperCase();
  const [rows, quote] = await Promise.all([getOwnerEarnings(ticker, 20), getQuote(ticker)]);
  const latest = rows[0];
  const prior = rows[1];
  const growth = yearOverYear(latest?.ownersEarnings, prior?.ownersEarnings);
  const yieldOnPrice =
    latest?.ownersEarningsPerShare && quote?.price ? latest.ownersEarningsPerShare / quote.price : null;
  const currency = reportingCurrency(latest?.reportedCurrency);
  const money = compactMoneyFn(currency);

  return (
    <Container>
      <PageHeader
        title={`${ticker} Owner Earnings`}
        description="Buffett-style owner earnings: cash available to shareholders after maintenance capital spending."
      />
      <SectionNav items={quoteFundamentalsNav(ticker)} />
      <MetricCards
        items={[
          { label: "Owner Earnings", value: money(latest?.ownersEarnings) },
          { label: "Per Share", value: latest?.ownersEarningsPerShare != null ? formatMoney(latest.ownersEarningsPerShare, currency) : "—" },
          { label: "Maintenance Capex", value: money(latest?.maintenanceCapex) },
          { label: "Growth Capex", value: money(latest?.growthCapex) },
          {
            label: "Period Growth",
            value: growth == null ? "—" : `${growth > 0 ? "+" : ""}${(growth * 100).toFixed(2)}%`,
          },
          {
            label: "Earnings / Price",
            value: yieldOnPrice == null ? "—" : `${(yieldOnPrice * 100).toFixed(2)}%`,
          },
        ]}
      />
      <p className="mt-3 text-sm text-muted">
        Latest period {latest ? `${latest.period} ${latest.fiscalYear}` : "—"}. Owner earnings adjust reported income for
        depreciation and the capex needed to maintain the business.
      </p>
      <MetricHistory
        title="Owner Earnings History"
        valueLabel="Owner Earnings"
        formatValue={money}
        empty="No owner earnings history available."
        rows={rows.map((row) => ({
          key: `${row.date}-${row.period}`,
          date: row.date,
          label: `${row.period} ${row.fiscalYear}`,
          value: row.ownersEarnings,
        }))}
      />
    </Container>
  );
}
