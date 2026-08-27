import { Container } from "@/components/container";
import { PageHeader } from "@/components/page-header";
import { SectionNav } from "@/components/section-nav";
import { quoteFundamentalsNav } from "@/lib/nav";
import { MetricCards } from "@/components/metric-cards";
import { MetricHistory } from "@/components/metric-history";
import { formatRatio } from "@/lib/format";
import { getBalanceSheets, getCashFlows, getCashFlowTtm } from "@/lib/fmp";
import { decodeTicker } from "@/lib/listings";
import { periodFrom } from "@/components/statement-metric-page";

function num(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function debtToFcf(debt: number | null, fcf: number | null) {
  if (debt == null || fcf == null || fcf === 0) return null;
  return debt / fcf;
}

export default async function DebtFcfPage({
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
  const [annualBalance, quarterBalance, annualCash, quarterlyCash, ttmCash] = await Promise.all([
    getBalanceSheets(ticker, "annual", 20),
    getBalanceSheets(ticker, "quarter", 12),
    getCashFlows(ticker, "annual", 20),
    getCashFlows(ticker, "quarter", 12),
    getCashFlowTtm(ticker),
  ]);
  const cashHistory = period === "quarter" ? quarterlyCash : annualCash;
  const latestDebt = num(quarterBalance[0]?.totalDebt) ?? num(annualBalance[0]?.totalDebt);
  const ttm = debtToFcf(latestDebt, num(ttmCash?.freeCashFlow));
  const fcfByDate = new Map(cashHistory.map((row) => [row.date, num(row.freeCashFlow)]));
  const balanceHistory = period === "quarter" ? quarterBalance : annualBalance;
  const rows = balanceHistory.map((row) => ({
    key: `${row.date}-${row.period}`,
    date: row.date,
    label: period === "quarter" ? `${row.period} ${row.fiscalYear}` : String(row.fiscalYear),
    value: debtToFcf(num(row.totalDebt), fcfByDate.get(row.date) ?? null),
  }));

  return (
    <Container>
      <PageHeader
        title={`${ticker} Debt / FCF`}
        description="Total debt divided by free cash flow, from live FMP balance sheets and cash flow statements."
      />
      <SectionNav items={quoteFundamentalsNav(ticker)} />
      <MetricCards items={[{ label: "Debt / FCF (ttm)", value: formatRatio(ttm) }]} />
      <MetricHistory
        period={period}
        annualHref={`/stocks/${ticker}/debt-fcf`}
        quarterHref={`/stocks/${ticker}/debt-fcf?period=quarter`}
        title={`${period === "quarter" ? "Quarterly" : "Annual"} Debt / FCF`}
        valueLabel="Debt / FCF"
        formatValue={formatRatio}
        empty="No debt / FCF history available."
        rows={rows}
      />
      <p className="mt-4 text-sm text-muted">Debt / FCF = Total Debt ÷ Free Cash Flow</p>
    </Container>
  );
}
