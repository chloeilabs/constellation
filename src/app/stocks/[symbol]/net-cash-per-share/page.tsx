import { Container } from "@/components/container";
import { PageHeader } from "@/components/page-header";
import { SectionNav } from "@/components/section-nav";
import { quoteFundamentalsNav } from "@/lib/nav";
import { MetricCards } from "@/components/metric-cards";
import { MetricHistory } from "@/components/metric-history";
import { ChangePercent } from "@/components/change";
import { formatMoney, reportingCurrency, yearOverYear } from "@/lib/format";
import { getBalanceSheets, getIncomeStatements } from "@/lib/fmp";
import { decodeTicker, stockPath } from "@/lib/listings";
import { netCashPosition } from "@/lib/utils";
import { periodFrom } from "@/components/statement-metric-page";

function num(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function perShare(cash: number | null, shares: number | null) {
  if (cash == null || shares == null || shares <= 0) return null;
  return cash / shares;
}

export default async function NetCashPerSharePage({
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
  const path = stockPath(ticker, "/net-cash-per-share");
  const [annual, quarterly, annualIncome, quarterlyIncome] = await Promise.all([
    getBalanceSheets(ticker, "annual", 20),
    getBalanceSheets(ticker, "quarter", 12),
    getIncomeStatements(ticker, "annual", 20),
    getIncomeStatements(ticker, "quarter", 12),
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
  const currentShares =
    num(quarterlyIncome[0]?.weightedAverageShsOutDil) ?? num(annualIncome[0]?.weightedAverageShsOutDil);
  const latestPerShare = perShare(netCashPosition(latest), currentShares);
  const priorShares = num(prior ? income.find((row) => row.date === prior.date)?.weightedAverageShsOutDil : null);
  const growth = yearOverYear(latestPerShare, perShare(netCashPosition(prior), priorShares));
  const sharesByDate = new Map(income.map((row) => [row.date, num(row.weightedAverageShsOutDil)]));
  const currency = reportingCurrency(latest?.reportedCurrency, annual[0]?.reportedCurrency);

  return (
    <Container>
      <PageHeader
        title={`${ticker} Net Cash Per Share`}
        description="Cash and investments minus total debt, divided by diluted weighted-average shares from the matching income statement."
      />
      <SectionNav items={quoteFundamentalsNav(ticker)} />
      <MetricCards
        items={[
          { label: "Net Cash / Share", value: formatMoney(latestPerShare, currency) },
          {
            label: period === "quarter" ? "QoQ Change" : "vs Last FY",
            value: growth == null ? "—" : <ChangePercent value={growth} alreadyPercent={false} className="text-2xl" />,
          },
        ]}
      />
      <MetricHistory
        period={period}
        annualHref={path}
        quarterHref={`${path}?period=quarter`}
        title={`${period === "quarter" ? "Quarterly" : "Annual"} Net Cash Per Share`}
        valueLabel="Net Cash / Share"
        formatValue={(value) => formatMoney(value, currency)}
        empty="No net cash per share history available."
        rows={history.map((row) => {
          const cash = netCashPosition(row);
          const shares = sharesByDate.get(row.date);
          return {
            key: `${row.date}-${row.period}`,
            date: row.date,
            label: period === "quarter" ? `${row.period} ${row.fiscalYear}` : String(row.fiscalYear),
            value: perShare(cash, shares ?? null),
          };
        })}
      />
    </Container>
  );
}
