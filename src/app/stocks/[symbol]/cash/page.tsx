import { Container } from "@/components/container";
import { PageHeader } from "@/components/page-header";
import { SectionNav } from "@/components/section-nav";
import { quoteFundamentalsNav } from "@/lib/nav";
import { MetricCards } from "@/components/metric-cards";
import { MetricHistory } from "@/components/metric-history";
import { ChangePercent } from "@/components/change";
import { compactMoneyFn, reportingCurrency, yearOverYear } from "@/lib/format";
import { getBalanceSheets } from "@/lib/fmp";
import { decodeTicker } from "@/lib/listings";
import { cashAndInvestments } from "@/lib/utils";
import { periodFrom } from "@/components/statement-metric-page";
import { ANNUAL_FILING_LIMIT, QUARTER_FILING_LIMIT } from "@/lib/statements";

export default async function CashPage({
  params,
  searchParams,
}: {
  params: Promise<{ symbol: string }>;
  searchParams: Promise<{ period?: string }>;
}) {
  const { symbol } = await params;
  const { period: periodParam } = await searchParams;
  const ticker = decodeTicker(symbol);
  const period = periodFrom(periodParam);
  const [annual, quarterly] = await Promise.all([
    getBalanceSheets(ticker, "annual", ANNUAL_FILING_LIMIT),
    getBalanceSheets(ticker, "quarter", QUARTER_FILING_LIMIT),
  ]);
  const history = period === "quarter" ? quarterly : annual;
  const latest = quarterly[0] ?? annual[0] ?? null;
  const prior =
    period === "quarter"
      ? quarterly[1]
      : latest && annual[0] && latest.date !== annual[0].date
        ? annual[0]
        : annual[1];
  const total = cashAndInvestments(latest);
  const growth = yearOverYear(total, cashAndInvestments(prior));
  const money = compactMoneyFn(reportingCurrency(latest?.reportedCurrency, annual[0]?.reportedCurrency));

  return (
    <Container>
      <PageHeader
        title={`${ticker} Cash`}
        description="Cash & investments is cash plus short-term and long-term marketable securities, matching Stock Analysis financials — not cash-on-hand alone."
      />
      <SectionNav items={quoteFundamentalsNav(ticker)} />
      <MetricCards
        items={[
          { label: "Cash & Investments", value: money(total) },
          {
            label: period === "quarter" ? "QoQ Change" : "vs Last FY",
            value: growth == null ? "—" : <ChangePercent value={growth} alreadyPercent={false} className="text-2xl" />,
          },
          { label: "Cash & Equivalents", value: money(latest?.cashAndCashEquivalents) },
          { label: "Short-Term Investments", value: money(latest?.shortTermInvestments) },
          { label: "Cash & Short-Term", value: money(latest?.cashAndShortTermInvestments) },
          { label: "Long-Term Investments", value: money(latest?.longTermInvestments) },
        ]}
      />
      <MetricHistory
        period={period}
        annualHref={`/stocks/${ticker}/cash`}
        quarterHref={`/stocks/${ticker}/cash?period=quarter`}
        title={`${period === "quarter" ? "Quarterly" : "Annual"} Cash & Investments`}
        valueLabel="Cash & Investments"
        formatValue={money}
        empty="No cash history available."
        rows={history.map((row) => ({
          key: `${row.date}-${row.period}`,
          date: row.date,
          label: period === "quarter" ? `${row.period} ${row.fiscalYear}` : String(row.fiscalYear),
          value: cashAndInvestments(row),
        }))}
      />
    </Container>
  );
}
