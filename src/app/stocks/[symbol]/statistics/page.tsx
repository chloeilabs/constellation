import { Container } from "@/components/container";
import { PageHeader } from "@/components/page-header";
import { SectionNav } from "@/components/section-nav";
import { StatGrid } from "@/components/quote-stats";
import { quoteFundamentalsNav } from "@/lib/nav";
import {
  formatCompactUsd,
  formatDate,
  formatNumber,
  formatPercentPlain,
  formatPrice,
  formatRatio,
} from "@/lib/format";
import { forwardPe as forwardPeFromEstimates } from "@/lib/valuation";
import {
  getBalanceSheets,
  getCashFlowTtm,
  getCompanyEarnings,
  getDcf,
  getDividends,
  getEmployeeCount,
  getEstimates,
  getIncomeTtm,
  getKeyMetricsTtm,
  getLatestRsi,
  getPriceChange,
  getProfile,
  getQuote,
  getRatings,
  getRatiosTtm,
  getScores,
  getShareFloat,
  getSplits,
} from "@/lib/fmp";

function num(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

export default async function StatisticsPage({ params }: { params: Promise<{ symbol: string }> }) {
  const { symbol } = await params;
  const ticker = symbol.toUpperCase();
  const [quote, profile, ratios, metrics, scores, shareFloat, dcf, ratings, ttm, cash, balance, earnings, dividends, splits, employees, estimates, changes, rsi] =
    await Promise.all([
      getQuote(ticker),
      getProfile(ticker),
      getRatiosTtm(ticker),
      getKeyMetricsTtm(ticker),
      getScores(ticker),
      getShareFloat(ticker),
      getDcf(ticker),
      getRatings(ticker),
      getIncomeTtm(ticker),
      getCashFlowTtm(ticker),
      getBalanceSheets(ticker, "quarter", 1),
      getCompanyEarnings(ticker, 1),
      getDividends(ticker, 1),
      getSplits(ticker, 5),
      getEmployeeCount(ticker, 1),
      getEstimates(ticker, "annual"),
      getPriceChange(ticker),
      getLatestRsi(ticker),
    ]);

  const sheet = balance[0] ?? null;
  const cashAndInvestments = num(sheet?.cashAndShortTermInvestments);
  const totalDebt = num(sheet?.totalDebt);
  const netCash = cashAndInvestments != null && totalDebt != null ? cashAndInvestments - totalDebt : null;
  const shares = num(shareFloat?.outstandingShares) ?? num(ttm?.weightedAverageShsOutDil);
  const headcount = employees[0]?.employeeCount ?? (profile?.fullTimeEmployees ? Number(profile.fullTimeEmployees) : null);
  const lastSplit = splits[0] ?? null;
  const dcfPrice = dcf?.dcf;
  const dcfUpside = dcfPrice != null && quote?.price ? ((dcfPrice - quote.price) / quote.price) * 100 : null;
  const oneYear = num(changes?.["1Y"]);

  return (
    <Container>
      <PageHeader
        title={`${ticker} Statistics`}
        description="Valuation, share count, profitability, financial position, and cash flow from live FMP filings."
      />
      <SectionNav items={quoteFundamentalsNav(ticker)} />
      <div className="grid gap-6 lg:grid-cols-2">
        <section>
          <h2 className="mb-3 font-semibold text-header">Total Valuation</h2>
          <StatGrid
            items={[
              { label: "Market Cap", href: `/stocks/${ticker}/market-cap`, value: formatCompactUsd(quote?.marketCap ?? profile?.marketCap) },
              { label: "Enterprise Value", href: `/stocks/${ticker}/enterprise-value`, value: formatCompactUsd(num(metrics?.enterpriseValueTTM)) },
            ]}
          />
        </section>
        <section>
          <h2 className="mb-3 font-semibold text-header">Important Dates</h2>
          <StatGrid
            items={[
              { label: "Earnings Date", value: formatDate(earnings[0]?.date) },
              { label: "Ex-Dividend Date", href: `/stocks/${ticker}/dividend`, value: formatDate(dividends[0]?.date) },
            ]}
          />
        </section>
        <section>
          <h2 className="mb-3 font-semibold text-header">Share Statistics</h2>
          <StatGrid
            items={[
              { label: "Shares Outstanding", href: `/stocks/${ticker}/shares`, value: formatNumber(shares, 0) },
              { label: "Float", href: `/stocks/${ticker}/shares`, value: formatNumber(shareFloat?.floatShares, 0) },
              { label: "Free Float", href: `/stocks/${ticker}/shares`, value: formatPercentPlain(shareFloat?.freeFloat, { alreadyPercent: true }) },
            ]}
          />
        </section>
        <section>
          <h2 className="mb-3 font-semibold text-header">Valuation Ratios</h2>
          <StatGrid
            items={[
              { label: "PE Ratio", href: `/stocks/${ticker}/pe-ratio`, value: formatRatio(num(ratios?.priceToEarningsRatioTTM) ?? quote?.pe) },
              { label: "Forward PE", value: formatRatio(forwardPeFromEstimates(quote?.price, estimates)) },
              { label: "PS Ratio", href: `/stocks/${ticker}/ps-ratio`, value: formatRatio(num(ratios?.priceToSalesRatioTTM)) },
              { label: "PB Ratio", href: `/stocks/${ticker}/pb-ratio`, value: formatRatio(num(ratios?.priceToBookRatioTTM)) },
              { label: "P/FCF", href: `/stocks/${ticker}/free-cash-flow`, value: formatRatio(num(ratios?.priceToFreeCashFlowRatioTTM)) },
              { label: "PEG Ratio", value: formatRatio(num((metrics as Record<string, unknown> | null)?.pegRatioTTM)) },
            ]}
          />
        </section>
        <section>
          <h2 className="mb-3 font-semibold text-header">Enterprise Valuation</h2>
          <StatGrid
            items={[
              { label: "EV / Sales", value: formatRatio(num(metrics?.evToSalesTTM)) },
              { label: "EV / EBITDA", value: formatRatio(num(metrics?.evToEBITDATTM)) },
              { label: "EV / FCF", value: formatRatio(num((metrics as Record<string, unknown> | null)?.evToFreeCashFlowTTM)) },
            ]}
          />
        </section>
        <section>
          <h2 className="mb-3 font-semibold text-header">Financial Position</h2>
          <StatGrid
            items={[
              { label: "Current Ratio", href: `/stocks/${ticker}/current-ratio`, value: formatRatio(num(ratios?.currentRatioTTM ?? metrics?.currentRatioTTM)) },
              { label: "Quick Ratio", value: formatRatio(num(ratios?.quickRatioTTM)) },
              { label: "Debt / Equity", value: formatRatio(num(ratios?.debtToEquityRatioTTM)) },
              { label: "Cash & Investments", href: `/stocks/${ticker}/cash`, value: formatCompactUsd(cashAndInvestments) },
              { label: "Total Debt", href: `/stocks/${ticker}/debt`, value: formatCompactUsd(totalDebt) },
              { label: "Net Cash", value: formatCompactUsd(netCash) },
              { label: "Book Value", href: `/stocks/${ticker}/equity`, value: formatCompactUsd(num(sheet?.totalStockholdersEquity)) },
            ]}
          />
        </section>
        <section>
          <h2 className="mb-3 font-semibold text-header">Financial Efficiency</h2>
          <StatGrid
            items={[
              { label: "Return on Equity", href: `/stocks/${ticker}/roe`, value: formatPercentPlain(num(metrics?.returnOnEquityTTM)) },
              { label: "Return on Assets", href: `/stocks/${ticker}/roa`, value: formatPercentPlain(num(metrics?.returnOnAssetsTTM)) },
              { label: "Return on Capital", href: `/stocks/${ticker}/roic`, value: formatPercentPlain(num(metrics?.returnOnInvestedCapitalTTM)) },
              { label: "Employees", href: `/stocks/${ticker}/employees`, value: formatNumber(headcount, 0) },
              {
                label: "Revenue / Employee",
                value: ttm?.revenue && headcount ? formatCompactUsd(ttm.revenue / headcount) : "—",
              },
            ]}
          />
        </section>
        <section>
          <h2 className="mb-3 font-semibold text-header">Income Statement (ttm)</h2>
          <StatGrid
            items={[
              { label: "Revenue", href: `/stocks/${ticker}/revenue`, value: formatCompactUsd(ttm?.revenue) },
              { label: "Gross Profit", href: `/stocks/${ticker}/gross-profit`, value: formatCompactUsd(ttm?.grossProfit) },
              { label: "Operating Income", href: `/stocks/${ticker}/operating-income`, value: formatCompactUsd(ttm?.operatingIncome) },
              { label: "Pretax Income", value: formatCompactUsd(ttm?.incomeBeforeTax) },
              { label: "Net Income", href: `/stocks/${ticker}/net-income`, value: formatCompactUsd(ttm?.netIncome) },
              { label: "EBITDA", href: `/stocks/${ticker}/ebitda`, value: formatCompactUsd(ttm?.ebitda) },
              { label: "EPS", href: `/stocks/${ticker}/earnings`, value: formatPrice(ttm?.epsDiluted ?? ttm?.eps) },
              { label: "Income Tax", value: formatCompactUsd(ttm?.incomeTaxExpense) },
            ]}
          />
        </section>
        <section>
          <h2 className="mb-3 font-semibold text-header">Cash Flow (ttm)</h2>
          <StatGrid
            items={[
              { label: "Operating Cash Flow", value: formatCompactUsd(cash?.operatingCashFlow) },
              { label: "Capital Expenditures", href: `/stocks/${ticker}/capex`, value: formatCompactUsd(cash?.capitalExpenditure) },
              { label: "Free Cash Flow", href: `/stocks/${ticker}/free-cash-flow`, value: formatCompactUsd(cash?.freeCashFlow) },
              { label: "FCF / Share", value: shares && cash?.freeCashFlow ? `$${formatPrice(cash.freeCashFlow / shares)}` : "—" },
              { label: "FCF Yield", value: formatPercentPlain(num(metrics?.freeCashFlowYieldTTM)) },
            ]}
          />
        </section>
        <section>
          <h2 className="mb-3 font-semibold text-header">Margins</h2>
          <StatGrid
            items={[
              { label: "Gross Margin", href: `/stocks/${ticker}/gross-profit`, value: formatPercentPlain(num(ratios?.grossProfitMarginTTM)) },
              { label: "Operating Margin", value: formatPercentPlain(num(ratios?.operatingProfitMarginTTM)) },
              { label: "Profit Margin", href: `/stocks/${ticker}/net-income`, value: formatPercentPlain(num(ratios?.netProfitMarginTTM)) },
              { label: "EBITDA Margin", href: `/stocks/${ticker}/ebitda`, value: formatPercentPlain(num(ratios?.ebitdaMarginTTM)) },
            ]}
          />
        </section>
        <section>
          <h2 className="mb-3 font-semibold text-header">Dividends & Yields</h2>
          <StatGrid
            items={[
              { label: "Dividend", href: `/stocks/${ticker}/dividend`, value: dividends[0] ? `$${formatPrice(dividends[0].dividend)}` : "—" },
              { label: "Dividend Yield", href: `/stocks/${ticker}/dividend`, value: formatPercentPlain(num(ratios?.dividendYieldTTM)) },
              { label: "Payout Ratio", value: formatPercentPlain(num(ratios?.dividendPayoutRatioTTM)) },
              { label: "Earnings Yield", value: formatPercentPlain(num(metrics?.earningsYieldTTM)) },
            ]}
          />
        </section>
        <section>
          <h2 className="mb-3 font-semibold text-header">Stock Price Statistics</h2>
          <StatGrid
            items={[
              { label: "Beta", value: formatRatio(profile?.beta) },
              { label: "52-Week Change", value: oneYear == null ? "—" : formatPercentPlain(oneYear, { alreadyPercent: true }) },
              { label: "52-Week High", value: formatPrice(quote?.yearHigh) },
              { label: "52-Week Low", value: formatPrice(quote?.yearLow) },
              { label: "50-Day Average", value: formatPrice(quote?.priceAvg50) },
              { label: "200-Day Average", value: formatPrice(quote?.priceAvg200) },
              { label: "RSI (14)", value: formatNumber(rsi?.rsi) },
              { label: "Average Volume", value: formatNumber(quote?.avgVolume ?? profile?.averageVolume, 0) },
            ]}
          />
        </section>
        <section>
          <h2 className="mb-3 font-semibold text-header">Fair Value</h2>
          <StatGrid
            items={[
              { label: "DCF Fair Value", value: dcfPrice != null ? `$${formatPrice(dcfPrice)}` : "—" },
              {
                label: "DCF Upside",
                value: dcfUpside == null ? "—" : `${dcfUpside > 0 ? "+" : ""}${dcfUpside.toFixed(1)}%`,
              },
              { label: "FMP Rating", href: `/stocks/${ticker}/forecast`, value: ratings?.rating ?? "—" },
            ]}
          />
        </section>
        <section>
          <h2 className="mb-3 font-semibold text-header">Stock Splits</h2>
          <StatGrid
            items={[
              { label: "Last Split Date", href: `/stocks/${ticker}/history`, value: formatDate(lastSplit?.date) },
              {
                label: "Split Ratio",
                href: `/stocks/${ticker}/history`,
                value: lastSplit ? `${lastSplit.numerator}:${lastSplit.denominator}` : "—",
              },
              { label: "Split Type", value: lastSplit?.splitType || "—" },
            ]}
          />
        </section>
        <section>
          <h2 className="mb-3 font-semibold text-header">Scores</h2>
          <StatGrid
            items={[
              { label: "Altman Z-Score", value: formatNumber(scores?.altmanZScore) },
              { label: "Piotroski Score", value: scores?.piotroskiScore ?? "—" },
            ]}
          />
        </section>
      </div>
    </Container>
  );
}
