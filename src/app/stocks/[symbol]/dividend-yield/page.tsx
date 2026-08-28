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
import {
  DISTRIBUTION_HISTORY_LIMIT,
  dividendYieldFromPrice,
  dividendsByFiscalYear,
  trailingDividendThrough,
  trimTrailingEmptyDividendHistory,
} from "@/lib/dividends";
import { historyLabel, priceFromForFilings } from "@/lib/period-valuation";
import { indicatedAnnualDividend } from "@/lib/utils";
import { filingLimit } from "@/lib/statements";
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
  const limit = filingLimit(period);
  const priceFrom = priceFromForFilings(period, limit);
  const [quote, profile, dividends, income, candles] = await Promise.all([
    getQuote(ticker),
    getProfile(ticker),
    getDividends(ticker, DISTRIBUTION_HISTORY_LIMIT),
    getIncomeStatements(ticker, period, limit),
    getDailyChart(ticker, priceFrom),
  ]);
  const indicated = indicatedAnnualDividend(dividends[0], profile?.lastDividend);
  const liveYield = dividendYieldFromPrice(indicated, quote?.price);
  const closes = toCloseSeries(candles);
  const byYear = period === "annual" ? dividendsByFiscalYear(dividends, income) : null;
  const history = trimTrailingEmptyDividendHistory(
    income.map((row) => {
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
        dps,
      };
    }),
    (row) => row.dps,
  );
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
        uses the last four payments on or before quarter end. Years before the first recorded payment are omitted.{" "}
        <span className="text-header">Formula: Dividend Yield = Dividends Per Share ÷ Price</span>
      </p>
    </Container>
  );
}
