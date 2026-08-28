import { Container } from "@/components/container";
import { PageHeader } from "@/components/page-header";
import { SectionNav } from "@/components/section-nav";
import { quoteFundamentalsNav } from "@/lib/nav";
import { MetricCards } from "@/components/metric-cards";
import { MetricHistory } from "@/components/metric-history";
import { formatRatio } from "@/lib/format";
import { getBalanceSheets, getIncomeStatements, getIncomeTtm } from "@/lib/fmp";
import { decodeTicker } from "@/lib/listings";
import { periodFrom } from "@/components/statement-metric-page";
import { ANNUAL_FILING_LIMIT, QUARTER_FILING_LIMIT } from "@/lib/statements";

function num(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function debtToEbitda(debt: number | null, ebitda: number | null) {
  if (debt == null || ebitda == null || ebitda === 0) return null;
  return debt / ebitda;
}

export default async function DebtEbitdaPage({
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
  const [annualBalance, quarterBalance, annualIncome, quarterlyIncome, ttm] = await Promise.all([
    getBalanceSheets(ticker, "annual", ANNUAL_FILING_LIMIT),
    getBalanceSheets(ticker, "quarter", QUARTER_FILING_LIMIT),
    getIncomeStatements(ticker, "annual", ANNUAL_FILING_LIMIT),
    getIncomeStatements(ticker, "quarter", QUARTER_FILING_LIMIT),
    getIncomeTtm(ticker),
  ]);
  const incomeHistory = period === "quarter" ? quarterlyIncome : annualIncome;
  const latestDebt = num(quarterBalance[0]?.totalDebt) ?? num(annualBalance[0]?.totalDebt);
  const ttmValue = debtToEbitda(latestDebt, num(ttm?.ebitda));
  const ebitdaByDate = new Map(incomeHistory.map((row) => [row.date, num(row.ebitda)]));
  const balanceHistory = period === "quarter" ? quarterBalance : annualBalance;
  const rows = balanceHistory.map((row) => ({
    key: `${row.date}-${row.period}`,
    date: row.date,
    label: period === "quarter" ? `${row.period} ${row.fiscalYear}` : String(row.fiscalYear),
    value: debtToEbitda(num(row.totalDebt), ebitdaByDate.get(row.date) ?? null),
  }));

  return (
    <Container>
      <PageHeader
        title={`${ticker} Debt / EBITDA`}
        description="Total debt divided by EBITDA, from live FMP balance sheets and income statements."
      />
      <SectionNav items={quoteFundamentalsNav(ticker)} />
      <MetricCards items={[{ label: "Debt / EBITDA (ttm)", value: formatRatio(ttmValue) }]} />
      <MetricHistory
        period={period}
        annualHref={`/stocks/${ticker}/debt-ebitda`}
        quarterHref={`/stocks/${ticker}/debt-ebitda?period=quarter`}
        title={`${period === "quarter" ? "Quarterly" : "Annual"} Debt / EBITDA`}
        valueLabel="Debt / EBITDA"
        formatValue={formatRatio}
        empty="No debt / EBITDA history available."
        rows={rows}
      />
      <p className="mt-4 text-sm text-muted">Debt / EBITDA = Total Debt ÷ EBITDA</p>
    </Container>
  );
}
