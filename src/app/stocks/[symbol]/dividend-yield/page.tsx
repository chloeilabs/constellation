import { Container } from "@/components/container";
import { PageHeader } from "@/components/page-header";
import { SectionNav } from "@/components/section-nav";
import { quoteFundamentalsNav } from "@/lib/nav";
import { MetricCards } from "@/components/metric-cards";
import { MetricHistory } from "@/components/metric-history";
import { formatMoney, formatPercentPlain } from "@/lib/format";
import { getDailyChart, getDividends, getIncomeStatements, getProfile, getQuote } from "@/lib/fmp";
import { closeOnOrBefore, toCloseSeries } from "@/lib/fundamental-chart";
import { decodeTicker, stockPath } from "@/lib/listings";
import { dividendYieldFromPrice, dividendsByFiscalYear, trailingDividendThrough } from "@/lib/dividends";
import { historyLabel } from "@/lib/period-valuation";
import { addDays, indicatedAnnualDividend, isoDate, nyDateString } from "@/lib/utils";
import { periodFrom } from "@/components/statement-metric-page";

export default async function DividendYieldPage({
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
  const path = stockPath(ticker, "/dividend-yield");
  const limit = period === "quarter" ? 12 : 20;
  const lookbackYears = period === "quarter" ? 12 : 22;
  const priceFrom = isoDate(addDays(new Date(`${nyDateString()}T00:00:00Z`), -365 * lookbackYears));
  const [quote, profile, dividends, income, candles] = await Promise.all([
    getQuote(ticker),
    getProfile(ticker),
    getDividends(ticker, 80),
    getIncomeStatements(ticker, period, limit),
    getDailyChart(ticker, priceFrom),
  ]);
  const indicated = indicatedAnnualDividend(dividends[0], profile?.lastDividend);
  const liveYield = dividendYieldFromPrice(indicated, quote?.price);
  const closes = toCloseSeries(candles);
  const byYear = period === "annual" ? dividendsByFiscalYear(dividends, income) : null;
  const history = income.map((row) => {
    const price = closeOnOrBefore(closes, row.date);
    const dps =
      period === "annual"
        ? (byYear?.get(String(row.fiscalYear)) ?? null)
        : trailingDividendThrough(dividends, row.date, 4);
    return {
      key: `${row.date}-${row.period}`,
      date: row.date,
      label: historyLabel(row, period),
      value: dividendYieldFromPrice(dps, price),
    };
  });
  const currency = profile?.currency || "USD";

  return (
    <Container>
      <PageHeader
        title={`${ticker} Dividend Yield`}
        description="Indicated annual dividends divided by live price. Fiscal history uses dividends paid in each period divided by the last FMP close on or before period end."
      />
      <SectionNav items={quoteFundamentalsNav(ticker)} />
      <MetricCards
        items={[
          { label: "Dividend Yield", value: formatPercentPlain(liveYield) },
          { label: "Annual Dividend", href: stockPath(ticker, "/dividend"), value: formatMoney(indicated, currency) },
          { label: "Stock Price", value: formatMoney(quote?.price, currency) },
          {
            label: period === "quarter" ? "Latest Quarter Yield" : "Last FY Yield",
            value: formatPercentPlain(history[0]?.value ?? null),
          },
        ]}
      />
      <MetricHistory
        period={period}
        annualHref={path}
        quarterHref={`${path}?period=quarter`}
        title={`${period === "quarter" ? "Quarterly" : "Annual"} Dividend Yield`}
        valueLabel="Dividend Yield"
        formatValue={formatPercentPlain}
        empty="No dividend yield history available."
        rows={history}
      />
      <p className="mt-4 text-sm text-muted">
        Current yield is the indicated annual dividend (latest payment × frequency) divided by the live price.
        Annual history uses dividends paid in that fiscal year divided by the period-end close. Quarterly history
        uses the last four payments on or before quarter end.{" "}
        <span className="text-header">Formula: Dividend Yield = Dividends Per Share ÷ Price</span>
      </p>
    </Container>
  );
}
