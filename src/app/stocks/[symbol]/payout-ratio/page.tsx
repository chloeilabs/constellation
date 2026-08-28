import { Container } from "@/components/container";
import { PageHeader } from "@/components/page-header";
import { SectionNav } from "@/components/section-nav";
import { quoteFundamentalsNav } from "@/lib/nav";
import { MetricCards } from "@/components/metric-cards";
import { MetricHistory } from "@/components/metric-history";
import { formatMoney, formatPercentPlain } from "@/lib/format";
import { getDividends, getIncomeStatements, getIncomeTtm, getProfile } from "@/lib/fmp";
import { decodeTicker, stockPath } from "@/lib/listings";
import { dividendsByFiscalYear, payoutRatioFromDps, trailingDividendThrough } from "@/lib/dividends";
import { historyLabel } from "@/lib/period-valuation";
import { indicatedAnnualDividend } from "@/lib/utils";
import { trailingSum } from "@/lib/statements";
import { periodFrom } from "@/components/statement-metric-page";

function epsOf(row: { epsDiluted?: number; eps?: number } | null | undefined) {
  if (row == null) return null;
  if (typeof row.epsDiluted === "number" && Number.isFinite(row.epsDiluted)) return row.epsDiluted;
  if (typeof row.eps === "number" && Number.isFinite(row.eps)) return row.eps;
  return null;
}

export default async function PayoutRatioPage({
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
  const path = stockPath(ticker, "/payout-ratio");
  const limit = period === "quarter" ? 12 : 20;
  const extra = period === "quarter" ? 4 : 0;
  const [profile, dividends, ttm, income] = await Promise.all([
    getProfile(ticker),
    getDividends(ticker, 80),
    getIncomeTtm(ticker),
    getIncomeStatements(ticker, period, limit + extra),
  ]);
  const indicated = indicatedAnnualDividend(dividends[0], profile?.lastDividend);
  const ttmEps = epsOf(ttm);
  const livePayout = payoutRatioFromDps(indicated, ttmEps);
  const byYear = period === "annual" ? dividendsByFiscalYear(dividends, income) : null;
  const history = income.slice(0, limit).map((row, index) => {
    const dps =
      period === "annual"
        ? (byYear?.get(String(row.fiscalYear)) ?? null)
        : trailingDividendThrough(dividends, row.date, 4);
    const eps =
      period === "annual"
        ? epsOf(row)
        : trailingSum(income as unknown as Array<Record<string, unknown>>, "epsDiluted", index, 4) ??
          trailingSum(income as unknown as Array<Record<string, unknown>>, "eps", index, 4);
    return {
      key: `${row.date}-${row.period}`,
      date: row.date,
      label: historyLabel(row, period),
      value: payoutRatioFromDps(dps, eps),
    };
  });
  const currency = profile?.currency || "USD";

  return (
    <Container>
      <PageHeader
        title={`${ticker} Payout Ratio`}
        description="Dividends per share divided by diluted EPS. Current uses the indicated annual dividend and trailing EPS. Fiscal history uses dividends paid in the period."
      />
      <SectionNav items={quoteFundamentalsNav(ticker)} />
      <MetricCards
        items={[
          { label: "Payout Ratio", value: formatPercentPlain(livePayout) },
          { label: "Annual Dividend", href: stockPath(ticker, "/dividend"), value: formatMoney(indicated, currency) },
          { label: "EPS (ttm)", href: stockPath(ticker, "/earnings"), value: formatMoney(ttmEps, currency) },
          {
            label: period === "quarter" ? "Latest Quarter Payout" : "Last FY Payout",
            value: formatPercentPlain(history[0]?.value ?? null),
          },
        ]}
      />
      <MetricHistory
        period={period}
        annualHref={path}
        quarterHref={`${path}?period=quarter`}
        title={`${period === "quarter" ? "Quarterly" : "Annual"} Payout Ratio`}
        valueLabel="Payout Ratio"
        formatValue={formatPercentPlain}
        empty="No payout ratio history available."
        rows={history}
      />
      <p className="mt-4 text-sm text-muted">
        Current payout is the indicated annual dividend divided by trailing diluted EPS. Annual history uses
        fiscal-year dividends divided by that year&apos;s diluted EPS. Quarterly history uses the last four payments
        divided by the sum of the last four quarterly diluted EPS figures.{" "}
        <span className="text-header">Formula: Payout Ratio = Dividends Per Share ÷ EPS</span>
      </p>
    </Container>
  );
}
