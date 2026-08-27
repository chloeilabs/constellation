import { Container } from "@/components/container";
import { DownloadCsvButton } from "@/components/download-csv";
import { PageHeader } from "@/components/page-header";
import { SectionNav } from "@/components/section-nav";
import { quoteFundamentalsNav } from "@/lib/nav";
import { MetricCards } from "@/components/metric-cards";
import { MetricHistory } from "@/components/metric-history";
import { ChangePercent } from "@/components/change";
import { compactMoneyFn, formatPercentPlain, reportingCurrency, yearOverYear } from "@/lib/format";
import { getCashFlows, getCashFlowTtm, getIncomeGrowth, getQuote, getRatiosTtm } from "@/lib/fmp";
import { decodeTicker, stockPath } from "@/lib/listings";
import { cashOutlay } from "@/lib/utils";

export default async function BuybacksPage({
  params,
  searchParams,
}: {
  params: Promise<{ symbol: string }>;
  searchParams: Promise<{ period?: string }>;
}) {
  const { symbol } = await params;
  const { period: periodParam } = await searchParams;
  const ticker = decodeTicker(symbol);
  const period = periodParam === "quarter" ? "quarter" : "annual";
  const base = stockPath(ticker, "/buybacks");
  const [annual, quarterly, ttm, quote, ratios, growthRows] = await Promise.all([
    getCashFlows(ticker, "annual", 20),
    getCashFlows(ticker, "quarter", 12),
    getCashFlowTtm(ticker),
    getQuote(ticker),
    getRatiosTtm(ticker),
    getIncomeGrowth(ticker, "annual", 1),
  ]);
  const history = period === "quarter" ? quarterly : annual;
  const ttmBuybacks = cashOutlay(ttm?.commonStockRepurchased);
  const ttmDividends = cashOutlay(ttm?.netDividendsPaid);
  const fyBuybacks = cashOutlay(annual[0]?.commonStockRepurchased);
  const priorBuybacks = cashOutlay(annual[1]?.commonStockRepurchased);
  const fyGrowth = yearOverYear(fyBuybacks, priorBuybacks);
  const marketCap = quote?.marketCap;
  const buybackYield = ttmBuybacks != null && marketCap ? ttmBuybacks / marketCap : null;
  const dividendYield = typeof ratios?.dividendYieldTTM === "number" ? ratios.dividendYieldTTM : null;
  const shareholderYield =
    buybackYield != null || dividendYield != null ? (buybackYield ?? 0) + (dividendYield ?? 0) : null;
  const tenYear = annual.slice(0, 10).reduce((sum, row) => sum + (cashOutlay(row.commonStockRepurchased) ?? 0), 0);
  const sharesYoy =
    typeof growthRows[0]?.growthWeightedAverageShsOutDil === "number"
      ? growthRows[0].growthWeightedAverageShsOutDil
      : null;
  const money = compactMoneyFn(reportingCurrency(ttm?.reportedCurrency, annual[0]?.reportedCurrency));

  return (
    <Container>
      <PageHeader
        title={`${ticker} Share Buybacks`}
        description="Share repurchases from the cash flow statement, with buyback yield and cash returned to shareholders."
        actions={
          <DownloadCsvButton
            filename={`${ticker}-buybacks-${period}.csv`}
            headers={["Period", "Date", "Buybacks"]}
            rows={history.map((row) => [
              period === "quarter" ? `${row.period} ${row.fiscalYear}` : String(row.fiscalYear),
              row.date,
              cashOutlay(row.commonStockRepurchased),
            ])}
          />
        }
      />
      <SectionNav items={quoteFundamentalsNav(ticker)} />
      <MetricCards
        items={[
          { label: "Buybacks (ttm)", value: money(ttmBuybacks) },
          {
            label: "Buyback Yield",
            value: formatPercentPlain(buybackYield),
          },
          { label: "Dividends Paid (ttm)", value: money(ttmDividends) },
          {
            label: "Shareholder Yield",
            value: formatPercentPlain(shareholderYield),
          },
          { label: "FY Buybacks", value: money(fyBuybacks) },
          {
            label: "FY Growth",
            value: fyGrowth == null ? "—" : <ChangePercent value={fyGrowth} alreadyPercent={false} className="text-2xl" />,
          },
          { label: "10Y Buybacks", value: money(tenYear || null) },
          {
            label: "Shares Change (YoY)",
            value: sharesYoy == null ? "—" : <ChangePercent value={sharesYoy} alreadyPercent={false} className="text-2xl" />,
            href: stockPath(ticker, "/shares"),
          },
        ]}
      />
      <div className="mt-8">
        <MetricHistory
          period={period}
          annualHref={base}
          quarterHref={`${base}?period=quarter`}
          title={`${period === "quarter" ? "Quarterly" : "Annual"} Share Buybacks`}
          valueLabel="Buybacks"
          formatValue={money}
          empty="No share-repurchase history available."
          rows={history.map((row) => ({
            key: `${row.date}-${row.period}`,
            date: row.date,
            label: period === "quarter" ? `${row.period} ${row.fiscalYear}` : String(row.fiscalYear),
            value: cashOutlay(row.commonStockRepurchased),
          }))}
        />
      </div>
      <p className="mt-4 text-sm text-muted">
        Buybacks are the absolute value of <span className="text-header">commonStockRepurchased</span> from FMP cash flow
        statements (reported as a financing outflow). Buyback yield is trailing repurchases divided by market cap.
        Shareholder yield adds the trailing dividend yield.
      </p>
    </Container>
  );
}
