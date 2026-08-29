import { Container } from "@/components/container";
import { PageHeader } from "@/components/page-header";
import { SectionNav } from "@/components/section-nav";
import { quoteFundamentalsNav } from "@/lib/nav";
import { MetricCards } from "@/components/metric-cards";
import { MetricHistory } from "@/components/metric-history";
import { ChangePercent } from "@/components/change";
import { compactMoneyFn, formatMoney, reportingCurrency, yearOverYear } from "@/lib/format";
import { getBalanceSheets, getIncomeStatements } from "@/lib/fmp";
import { decodeTicker } from "@/lib/listings";
import { cashAndInvestments, netCashPosition } from "@/lib/utils";
import { periodFrom } from "@/components/statement-metric-page";
import { ANNUAL_FILING_LIMIT, QUARTER_FILING_LIMIT } from "@/lib/statements";

function num(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

export default async function NetCashPage({
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
  const [annual, quarterly, annualIncome, quarterlyIncome] = await Promise.all([
    getBalanceSheets(ticker, "annual", ANNUAL_FILING_LIMIT),
    getBalanceSheets(ticker, "quarter", QUARTER_FILING_LIMIT),
    getIncomeStatements(ticker, "annual", ANNUAL_FILING_LIMIT),
    getIncomeStatements(ticker, "quarter", QUARTER_FILING_LIMIT),
  ]);
  const history = period === "quarter" ? quarterly : annual;
  const income = period === "quarter" ? quarterlyIncome : annualIncome;
  const latest = quarterly[0] ?? annual[0] ?? null;
  const prior =
    period === "quarter"
      ? quarterly[1]
      : latest && annual[0] && latest.date !== annual[0].date
        ? annual[0]
        : annual[1];
  const netCash = netCashPosition(latest);
  const growth = yearOverYear(netCash, netCashPosition(prior));
  const currentShares =
    num(quarterlyIncome[0]?.weightedAverageShsOutDil) ??
    num(annualIncome[0]?.weightedAverageShsOutDil);
  const perShare = netCash != null && currentShares && currentShares > 0 ? netCash / currentShares : null;
  const sharesByDate = new Map(income.map((row) => [row.date, num(row.weightedAverageShsOutDil)]));
  const currency = reportingCurrency(latest?.reportedCurrency, annual[0]?.reportedCurrency);
  const money = compactMoneyFn(currency);

  return (
    <Container>
      <PageHeader
        title={`${ticker} Net Cash`}
        description="Cash & investments minus total debt. Positive is net cash; negative is net debt."
      />
      <SectionNav items={quoteFundamentalsNav(ticker)} />
      <MetricCards
        items={[
          { label: "Net Cash (Debt)", value: money(netCash) },
          {
            label: period === "quarter" ? "QoQ Change" : "vs Last FY",
            value: growth == null ? "—" : <ChangePercent value={growth} alreadyPercent={false} className="text-2xl" />,
          },
          { label: "Net Cash / Share", value: formatMoney(perShare, currency) },
          { label: "Cash & Investments", href: `/stocks/${ticker}/cash`, value: money(cashAndInvestments(latest)) },
          { label: "Total Debt", href: `/stocks/${ticker}/debt`, value: money(latest?.totalDebt) },
        ]}
      />
      <MetricHistory
        period={period}
        annualHref={`/stocks/${ticker}/net-cash`}
        quarterHref={`/stocks/${ticker}/net-cash?period=quarter`}
        title={`${period === "quarter" ? "Quarterly" : "Annual"} Net Cash`}
        valueLabel="Net Cash"
        formatValue={money}
        empty="No net cash history available."
        rows={history.map((row) => ({
          key: `${row.date}-${row.period}`,
          date: row.date,
          label: period === "quarter" ? `${row.period} ${row.fiscalYear}` : String(row.fiscalYear),
          value: netCashPosition(row),
        }))}
      />
      <MetricHistory
        period={period}
        title={`${period === "quarter" ? "Quarterly" : "Annual"} Net Cash Per Share`}
        valueLabel="Net Cash / Share"
        formatValue={(value) => formatMoney(value, currency)}
        empty="No net cash per share history available."
        rows={history.map((row) => {
          const cash = netCashPosition(row);
          const shares = sharesByDate.get(row.date);
          return {
            key: `${row.date}-${row.period}-ps`,
            date: row.date,
            label: period === "quarter" ? `${row.period} ${row.fiscalYear}` : String(row.fiscalYear),
            value: cash != null && shares && shares > 0 ? cash / shares : null,
          };
        })}
      />
    </Container>
  );
}
