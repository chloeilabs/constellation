import { Container } from "@/components/container";
import { DownloadCsvButton } from "@/components/download-csv";
import { PageHeader } from "@/components/page-header";
import { SectionNav } from "@/components/section-nav";
import { quoteFundamentalsNav } from "@/lib/nav";
import { MetricCards } from "@/components/metric-cards";
import { MetricHistory } from "@/components/metric-history";
import { ChangePercent } from "@/components/change";
import { formatCompact, formatCompactMoney, formatDate, formatMoney, formatPercentPlain } from "@/lib/format";
import { getIncomeGrowth, getIncomeStatements, getProfile, getQuote, getShareFloat } from "@/lib/fmp";
import { decodeTicker, stockPath } from "@/lib/listings";
import { relativeChange } from "@/lib/utils";

export default async function SharesPage({
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
  const base = stockPath(ticker, "/shares");
  const [quote, profile, shareFloat, annual, quarterly, growthRows] = await Promise.all([
    getQuote(ticker),
    getProfile(ticker),
    getShareFloat(ticker),
    getIncomeStatements(ticker, "annual", 20),
    getIncomeStatements(ticker, "quarter", 12),
    getIncomeGrowth(ticker, "annual", 1),
  ]);
  const history = period === "quarter" ? quarterly : annual;
  const outstanding =
    shareFloat?.outstandingShares ?? annual[0]?.weightedAverageShsOutDil ?? quote?.sharesOutstanding;
  const floatShares = shareFloat?.floatShares;
  const restricted =
    typeof outstanding === "number" && typeof floatShares === "number" ? outstanding - floatShares : null;
  const sharesYoy =
    (typeof growthRows[0]?.growthWeightedAverageShsOutDil === "number" ? growthRows[0].growthWeightedAverageShsOutDil : null) ??
    relativeChange(annual[0]?.weightedAverageShsOutDil, annual[1]?.weightedAverageShsOutDil);
  const sharesQoq = relativeChange(quarterly[0]?.weightedAverageShsOutDil, quarterly[1]?.weightedAverageShsOutDil);

  return (
    <Container>
      <PageHeader
        title={`${ticker} Shares Outstanding`}
        description="Shares outstanding, public float, and diluted weighted-average share history from live FMP filings."
        actions={
          <DownloadCsvButton
            filename={`${ticker}-shares-${period}.csv`}
            headers={["Period", "Date", "Shares"]}
            rows={history.map((row) => [
              period === "quarter" ? `${row.period} ${row.fiscalYear}` : String(row.fiscalYear),
              row.date,
              row.weightedAverageShsOutDil,
            ])}
          />
        }
      />
      <SectionNav items={quoteFundamentalsNav(ticker)} />
      <MetricCards
        items={[
          { label: "Shares Outstanding", value: formatCompact(outstanding) },
          {
            label: "Shares Change (YoY)",
            value: sharesYoy == null ? "—" : <ChangePercent value={sharesYoy} alreadyPercent={false} className="text-2xl" />,
          },
          {
            label: "Shares Change (QoQ)",
            value: sharesQoq == null ? "—" : <ChangePercent value={sharesQoq} alreadyPercent={false} className="text-2xl" />,
          },
          { label: "Float", value: formatCompact(floatShares) },
          {
            label: "Free Float",
            value: formatPercentPlain(shareFloat?.freeFloat, { alreadyPercent: true }),
          },
          { label: "Restricted", value: formatCompact(restricted) },
          { label: "Market Cap", value: formatCompactMoney(quote?.marketCap, profile?.currency) },
          { label: "Stock Price", value: formatMoney(quote?.price, profile?.currency) },
        ]}
      />
      <p className="mt-4 text-sm text-muted">
        As of {formatDate(shareFloat?.date)}. Float is the shares available to trade; restricted shares are outstanding
        minus float. The history chart uses diluted weighted-average shares from the income statement.{" "}
        <a href={`/stocks/${ticker}/buybacks`} className="text-link hover:underline">
          Share buybacks
        </a>{" "}
        reduce the share count over time.
        {shareFloat?.source ? (
          <>
            {" "}
            <a href={shareFloat.source} className="text-link hover:underline" target="_blank" rel="noreferrer">
              Source filing
            </a>
          </>
        ) : null}
      </p>
      <div className="mt-8">
        <MetricHistory
          period={period}
          annualHref={base}
          quarterHref={`${base}?period=quarter`}
          title={`${period === "quarter" ? "Quarterly" : "Annual"} Shares Outstanding`}
          valueLabel="Shares"
          formatValue={formatCompact}
          empty="No share-count history available."
          rows={history.map((row) => ({
            key: `${row.date}-${row.period}`,
            date: row.date,
            label: period === "quarter" ? `${row.period} ${row.fiscalYear}` : String(row.fiscalYear),
            value: row.weightedAverageShsOutDil,
          }))}
        />
      </div>
    </Container>
  );
}
