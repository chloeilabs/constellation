import { Container } from "@/components/container";
import { PageHeader } from "@/components/page-header";
import { StatGrid } from "@/components/quote-stats";
import { formatCompactUsd, formatNumber, formatPercentPlain, formatPrice, formatRatio } from "@/lib/format";
import { getKeyMetricsTtm, getProfile, getQuote, getRatiosTtm, getScores, getShareFloat } from "@/lib/fmp";

function num(value: unknown) {
  return typeof value === "number" ? value : null;
}

export default async function StatisticsPage({ params }: { params: Promise<{ symbol: string }> }) {
  const { symbol } = await params;
  const ticker = symbol.toUpperCase();
  const [quote, profile, ratios, metrics, scores, shareFloat] = await Promise.all([
    getQuote(ticker),
    getProfile(ticker),
    getRatiosTtm(ticker),
    getKeyMetricsTtm(ticker),
    getScores(ticker),
    getShareFloat(ticker),
  ]);

  return (
    <Container>
      <PageHeader
        title={`${ticker} Statistics`}
        description="Trailing twelve-month valuation, profitability, and financial health metrics."
      />
      <div className="grid gap-6 lg:grid-cols-2">
        <section>
          <h2 className="mb-3 font-semibold text-header">Valuation</h2>
          <StatGrid
            items={[
              { label: "Market Cap", value: formatCompactUsd(quote?.marketCap ?? profile?.marketCap) },
              { label: "Enterprise Value", value: formatCompactUsd(num(metrics?.enterpriseValueTTM)) },
              { label: "PE Ratio (ttm)", value: formatRatio(num(ratios?.priceToEarningsRatioTTM)) },
              { label: "PB Ratio", value: formatRatio(num(ratios?.priceToBookRatioTTM)) },
              { label: "PS Ratio", value: formatRatio(num(ratios?.priceToSalesRatioTTM)) },
              { label: "P/FCF", value: formatRatio(num(ratios?.priceToFreeCashFlowRatioTTM)) },
              { label: "EV / Sales", value: formatRatio(num(metrics?.evToSalesTTM)) },
              { label: "EV / EBITDA", value: formatRatio(num(metrics?.evToEBITDATTM)) },
            ]}
          />
        </section>
        <section>
          <h2 className="mb-3 font-semibold text-header">Profitability</h2>
          <StatGrid
            items={[
              { label: "Gross Margin", value: formatPercentPlain(num(ratios?.grossProfitMarginTTM)) },
              { label: "Operating Margin", value: formatPercentPlain(num(ratios?.operatingProfitMarginTTM)) },
              { label: "Profit Margin", value: formatPercentPlain(num(ratios?.netProfitMarginTTM)) },
              { label: "EBITDA Margin", value: formatPercentPlain(num(ratios?.ebitdaMarginTTM)) },
              { label: "ROA", value: formatPercentPlain(num(metrics?.returnOnAssetsTTM)) },
              { label: "ROE", value: formatPercentPlain(num(metrics?.returnOnEquityTTM)) },
              { label: "ROIC", value: formatPercentPlain(num(metrics?.returnOnInvestedCapitalTTM)) },
              { label: "Earnings Yield", value: formatPercentPlain(num(metrics?.earningsYieldTTM)) },
            ]}
          />
        </section>
        <section>
          <h2 className="mb-3 font-semibold text-header">Liquidity & Leverage</h2>
          <StatGrid
            items={[
              { label: "Current Ratio", value: formatRatio(num(ratios?.currentRatioTTM ?? metrics?.currentRatioTTM)) },
              { label: "Quick Ratio", value: formatRatio(num(ratios?.quickRatioTTM)) },
              { label: "Debt / Equity", value: formatRatio(num(ratios?.debtToEquityRatioTTM)) },
              { label: "Beta", value: formatRatio(profile?.beta) },
              { label: "52-Week High", value: formatPrice(quote?.yearHigh) },
              { label: "52-Week Low", value: formatPrice(quote?.yearLow) },
              { label: "50-Day Average", value: formatPrice(quote?.priceAvg50) },
              { label: "200-Day Average", value: formatPrice(quote?.priceAvg200) },
            ]}
          />
        </section>
        <section>
          <h2 className="mb-3 font-semibold text-header">Financial Health</h2>
          <StatGrid
            items={[
              { label: "Altman Z-Score", value: formatNumber(scores?.altmanZScore) },
              { label: "Piotroski Score", value: scores?.piotroskiScore ?? "—" },
              { label: "FCF Yield", value: formatPercentPlain(num(metrics?.freeCashFlowYieldTTM)) },
              { label: "Dividend Yield", value: formatPercentPlain(num(ratios?.dividendYieldTTM)) },
              { label: "Payout Ratio", value: formatPercentPlain(num(ratios?.dividendPayoutRatioTTM)) },
              { label: "Average Volume", value: formatNumber(profile?.averageVolume, 0) },
              { label: "Shares Outstanding", value: formatNumber(shareFloat?.outstandingShares, 0) },
              { label: "Float", value: formatNumber(shareFloat?.floatShares, 0) },
              { label: "Free Float", value: formatPercentPlain(shareFloat?.freeFloat, { alreadyPercent: true }) },
            ]}
          />
        </section>
      </div>
    </Container>
  );
}
