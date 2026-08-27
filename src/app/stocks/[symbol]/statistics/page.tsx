import { Container } from "@/components/container";
import { PageHeader } from "@/components/page-header";
import { SectionNav } from "@/components/section-nav";
import { StatGrid } from "@/components/quote-stats";
import { quoteFundamentalsNav } from "@/lib/nav";
import {
  formatCompactMoney,
  formatDate,
  formatMoney,
  formatNumber,
  formatPercentPlain,
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
  getEsgRatings,
  getIncomeGrowth,
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
  const [quote, profile, ratios, metrics, scores, shareFloat, dcf, ratings, ttm, cash, balance, earnings, dividends, splits, employees, estimates, changes, rsi, growthRows, esgRatings] =
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
      getIncomeGrowth(ticker, "annual", 1),
      getEsgRatings(ticker),
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
  const peValue = num(ratios?.priceToEarningsRatioTTM) ?? quote?.pe ?? null;
  const epsGrowth = num(growthRows[0]?.growthEPSDiluted) ?? num(growthRows[0]?.growthEPS);
  const peg = peValue != null && epsGrowth != null && epsGrowth > 0 ? peValue / (epsGrowth * 100) : null;
  const currency = profile?.currency || "USD";
  const money = (value: number | null | undefined) => formatCompactMoney(value, currency);
  const esgRating = [...esgRatings].sort((a, b) => (b.fiscalYear ?? 0) - (a.fiscalYear ?? 0))[0] ?? null;

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
              { label: "Market Cap", href: `/stocks/${ticker}/market-cap`, value: money(quote?.marketCap ?? profile?.marketCap) },
              { label: "Enterprise Value", href: `/stocks/${ticker}/enterprise-value`, value: money(num(metrics?.enterpriseValueTTM)) },
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
              { label: "PE Ratio", href: `/stocks/${ticker}/pe-ratio`, value: formatRatio(peValue) },
              { label: "Forward PE", value: formatRatio(forwardPeFromEstimates(quote?.price, estimates)) },
              { label: "PS Ratio", href: `/stocks/${ticker}/ps-ratio`, value: formatRatio(num(ratios?.priceToSalesRatioTTM)) },
              { label: "PB Ratio", href: `/stocks/${ticker}/pb-ratio`, value: formatRatio(num(ratios?.priceToBookRatioTTM)) },
              { label: "P/FCF", href: `/stocks/${ticker}/free-cash-flow`, value: formatRatio(num(ratios?.priceToFreeCashFlowRatioTTM)) },
              { label: "PEG Ratio", value: formatRatio(peg ?? num(metrics?.pegRatioTTM)) },
              { label: "Graham Number", value: formatMoney(num(metrics?.grahamNumberTTM), currency) },
              { label: "Net Debt / EBITDA", value: formatRatio(num(metrics?.netDebtToEBITDATTM)) },
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
              { label: "Cash & Investments", href: `/stocks/${ticker}/cash`, value: money(cashAndInvestments) },
              { label: "Total Debt", href: `/stocks/${ticker}/debt`, value: money(totalDebt) },
              { label: "Net Cash", value: money(netCash) },
              { label: "Book Value", href: `/stocks/${ticker}/equity`, value: money(num(sheet?.totalStockholdersEquity)) },
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
                value: ttm?.revenue && headcount ? money(ttm.revenue / headcount) : "—",
              },
            ]}
          />
        </section>
        <section>
          <h2 className="mb-3 font-semibold text-header">Income Statement (ttm)</h2>
          <StatGrid
            items={[
              { label: "Revenue", href: `/stocks/${ticker}/revenue`, value: money(ttm?.revenue) },
              { label: "Gross Profit", href: `/stocks/${ticker}/gross-profit`, value: money(ttm?.grossProfit) },
              { label: "Operating Income", href: `/stocks/${ticker}/operating-income`, value: money(ttm?.operatingIncome) },
              { label: "Pretax Income", value: money(ttm?.incomeBeforeTax) },
              { label: "Net Income", href: `/stocks/${ticker}/net-income`, value: money(ttm?.netIncome) },
              { label: "EBITDA", href: `/stocks/${ticker}/ebitda`, value: money(ttm?.ebitda) },
              { label: "EPS", href: `/stocks/${ticker}/earnings`, value: formatMoney(ttm?.epsDiluted ?? ttm?.eps, currency) },
              { label: "Income Tax", value: money(ttm?.incomeTaxExpense) },
            ]}
          />
        </section>
        <section>
          <h2 className="mb-3 font-semibold text-header">Cash Flow (ttm)</h2>
          <StatGrid
            items={[
              { label: "Operating Cash Flow", value: money(cash?.operatingCashFlow) },
              { label: "Capital Expenditures", href: `/stocks/${ticker}/capex`, value: money(cash?.capitalExpenditure) },
              { label: "Free Cash Flow", href: `/stocks/${ticker}/free-cash-flow`, value: money(cash?.freeCashFlow) },
              { label: "FCF / Share", value: shares && cash?.freeCashFlow ? formatMoney(cash.freeCashFlow / shares, currency) : "—" },
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
              { label: "Dividend", href: `/stocks/${ticker}/dividend`, value: dividends[0] ? formatMoney(dividends[0].dividend, currency) : "—" },
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
              { label: "52-Week High", value: formatMoney(quote?.yearHigh, currency) },
              { label: "52-Week Low", value: formatMoney(quote?.yearLow, currency) },
              { label: "50-Day Average", value: formatMoney(quote?.priceAvg50, currency) },
              { label: "200-Day Average", value: formatMoney(quote?.priceAvg200, currency) },
              { label: "RSI (14)", value: formatNumber(rsi?.rsi) },
              { label: "Average Volume", value: formatNumber(quote?.avgVolume ?? profile?.averageVolume, 0) },
            ]}
          />
        </section>
        <section>
          <h2 className="mb-3 font-semibold text-header">Fair Value</h2>
          <StatGrid
            items={[
              { label: "DCF Fair Value", value: dcfPrice != null ? formatMoney(dcfPrice, currency) : "—" },
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
              { label: "ESG Rating", href: `/stocks/${ticker}/company`, value: esgRating?.ESGRiskRating ?? "—" },
              { label: "ESG Industry Rank", href: `/stocks/${ticker}/company`, value: esgRating?.industryRank ?? "—" },
            ]}
          />
        </section>
      </div>
    </Container>
  );
}
