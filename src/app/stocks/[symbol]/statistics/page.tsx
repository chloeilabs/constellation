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
import { actualToEstimateCagr, buybackYieldFromShareChange, estimateCagr, forwardPe as forwardPeFromEstimates, forwardPs, lynchFairValue, pegRatio, trailingPe } from "@/lib/valuation";
import {
  getBalanceSheets,
  getCashFlowTtm,
  getCompanyEarnings,
  getDcf,
  getDividends,
  getEmployeeCount,
  getEstimates,
  getEsgRatings,
  getGradesConsensus,
  getIncomeGrowth,
  getIncomeStatements,
  getIncomeTtm,
  getKeyMetricsTtm,
  getLatestEma,
  getLatestInstitutionalOwnership,
  getLatestRsi,
  getPriceChange,
  getPriceTarget,
  getProfile,
  getQuote,
  getRatings,
  getRatiosTtm,
  getScores,
  getShareFloat,
  getSplits,
  getTreasuryRates,
  getYearAgoMarketCap,
} from "@/lib/fmp";
import { decodeTicker } from "@/lib/listings";
import { industryHref, sectorHref, sectorIndustryPe } from "@/lib/industries";
import { padCik } from "@/lib/institutional";
import { addDays, cashAndInvestments as cashAndInvestmentsOf, indicatedAnnualDividend, isoDate, netCashPosition, nyDateString, relativeChange } from "@/lib/utils";
import { consecutiveDividendGrowthYears, dividendTtmGrowth, dividendsByFiscalYear } from "@/lib/dividends";
import { derivedStatementMetrics } from "@/lib/statements";
import { estimatedWacc } from "@/lib/wacc";
import { earningsSurprise, splitCompanyEarnings } from "@/lib/earnings";
import { ChangePercent } from "@/components/change";
import Link from "next/link";

function num(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

export default async function StatisticsPage({ params }: { params: Promise<{ symbol: string }> }) {
  const { symbol } = await params;
  const ticker = decodeTicker(symbol);
  const [
    quote,
    profile,
    ratios,
    metrics,
    scores,
    shareFloat,
    dcf,
    ratings,
    ttm,
    cash,
    balance,
    earnings,
    dividends,
    splits,
    employees,
    estimates,
    changes,
    rsi,
    ema12,
    ema26,
    growthRows,
    esgRatings,
    target,
    grades,
    quarterlyIncome,
    yearAgoCap,
    institutional,
    treasury,
    annualIncome,
  ] = await Promise.all([
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
    getCompanyEarnings(ticker, 12),
    getDividends(ticker, 80),
    getSplits(ticker, 5),
    getEmployeeCount(ticker, 1),
    getEstimates(ticker, "annual"),
    getPriceChange(ticker),
    getLatestRsi(ticker),
    getLatestEma(ticker, 12),
    getLatestEma(ticker, 26),
    getIncomeGrowth(ticker, "annual", 1),
    getEsgRatings(ticker),
    getPriceTarget(ticker),
    getGradesConsensus(ticker),
    getIncomeStatements(ticker, "quarter", 2),
    getYearAgoMarketCap(ticker),
    getLatestInstitutionalOwnership(ticker, 0),
    getTreasuryRates(isoDate(addDays(new Date(`${nyDateString()}T00:00:00Z`), -30)), nyDateString()),
    getIncomeStatements(ticker, "annual", 16),
  ]);
  const { sectorPe, industryPe } = await sectorIndustryPe(profile?.sector, profile?.industry);

  const sheet = balance[0] ?? null;
  const cashAndInvestments = cashAndInvestmentsOf(sheet);
  const totalDebt = num(sheet?.totalDebt);
  const netCash = netCashPosition(sheet);
  const shares = num(shareFloat?.outstandingShares) ?? num(ttm?.weightedAverageShsOutDil);
  const headcount = employees[0]?.employeeCount ?? (profile?.fullTimeEmployees ? Number(profile.fullTimeEmployees) : null);
  const lastSplit = splits[0] ?? null;
  const dcfPrice = dcf?.dcf;
  const dcfUpside = dcfPrice != null && quote?.price ? ((dcfPrice - quote.price) / quote.price) * 100 : null;
  const oneYear = num(changes?.["1Y"]);
  const impliedPe = trailingPe(quote?.price, ttm?.epsDiluted ?? ttm?.eps);
  const peValue = impliedPe ?? num(ratios?.priceToEarningsRatioTTM) ?? quote?.pe ?? null;
  const sectorPeVs = peValue != null && sectorPe ? peValue / sectorPe - 1 : null;
  const industryPeVs = peValue != null && industryPe ? peValue / industryPe - 1 : null;
  const epsGrowth = num(growthRows[0]?.growthEPSDiluted) ?? num(growthRows[0]?.growthEPS);
  const lastAnnual = annualIncome[0];
  const epsCagr =
    actualToEstimateCagr(lastAnnual?.epsDiluted ?? lastAnnual?.eps, lastAnnual?.date, estimates, "epsAvg", 3) ??
    estimateCagr(estimates, "epsAvg", 3);
  const revenueCagr =
    actualToEstimateCagr(lastAnnual?.revenue, lastAnnual?.date, estimates, "revenueAvg", 3) ??
    estimateCagr(estimates, "revenueAvg", 3);
  const peg =
    pegRatio(peValue, epsCagr) ??
    num(ratios?.priceToEarningsGrowthRatioTTM) ??
    (peValue != null && epsGrowth != null && epsGrowth > 0 ? peValue / (epsGrowth * 100) : null) ??
    num(metrics?.pegRatioTTM);
  const currency = profile?.currency || "USD";
  const money = (value: number | null | undefined) => formatCompactMoney(value, currency);
  const esgRating = [...esgRatings].sort((a, b) => (b.fiscalYear ?? 0) - (a.fiscalYear ?? 0))[0] ?? null;
  const marketCap = quote?.marketCap ?? profile?.marketCap ?? null;
  const enterpriseValue =
    marketCap != null && netCash != null
      ? marketCap - netCash
      : num(metrics?.enterpriseValueTTM) ?? num(ratios?.enterpriseValueTTM);
  const marketCapYoy = relativeChange(marketCap, yearAgoCap?.marketCap);
  const sharesYoy =
    num(growthRows[0]?.growthWeightedAverageShsOutDil) ??
    num(growthRows[0]?.growthWeightedAverageShsOut);
  const sharesQoq = relativeChange(
    num(quarterlyIncome[0]?.weightedAverageShsOutDil),
    num(quarterlyIncome[1]?.weightedAverageShsOutDil),
  );
  const institutionPct = num(institutional.summary?.ownershipPercent);
  const cik = padCik(profile?.cik ?? "");
  const isin = profile?.isin || "";
  const cusip = profile?.cusip || "";
  const repurchase = num(cash?.commonStockRepurchased);
  const cashBuybackYield =
    marketCap && marketCap > 0 && repurchase != null && repurchase !== 0 ? Math.abs(repurchase) / marketCap : null;
  const buybackYield = buybackYieldFromShareChange(sharesYoy) ?? cashBuybackYield;
  const dividendYield = num(ratios?.dividendYieldTTM);
  const derivedTtm = ttm
    ? derivedStatementMetrics({
        ...(ttm as unknown as Record<string, unknown>),
        depreciationAndAmortization:
          (ttm as unknown as Record<string, unknown>).depreciationAndAmortization ?? cash?.depreciationAndAmortization,
        freeCashFlow: cash?.freeCashFlow,
      })
    : null;
  const ttmEps = num(ttm?.epsDiluted) ?? num(ttm?.eps);
  const lynchValue = lynchFairValue(ttmEps, epsCagr);
  const lynchUpside = lynchValue != null && quote?.price ? (lynchValue - quote.price) / quote.price : null;
  const dpsGrowth = dividendTtmGrowth(dividends);
  const dividendsByYear = dividendsByFiscalYear(dividends, annualIncome);
  const lastCompleteFy = annualIncome[0]?.fiscalYear != null ? String(annualIncome[0].fiscalYear) : null;
  const completeDividendYears = [...dividendsByYear.keys()]
    .filter((year) => !lastCompleteFy || year <= lastCompleteFy)
    .sort();
  const dividendGrowthYears = consecutiveDividendGrowthYears(dividendsByYear, completeDividendYears);
  const debtFcf =
    totalDebt != null && num(cash?.freeCashFlow) != null && cash!.freeCashFlow !== 0
      ? totalDebt / cash!.freeCashFlow
      : null;
  const shareholderYield =
    buybackYield != null || dividendYield != null ? (buybackYield ?? 0) + (dividendYield ?? 0) : null;
  const fcfMargin =
    num(ttm?.revenue) && num(cash?.freeCashFlow) != null && ttm!.revenue !== 0
      ? cash!.freeCashFlow / ttm!.revenue
      : null;
  const targetUpside =
    target?.targetConsensus != null && quote?.price
      ? ((target.targetConsensus - quote.price) / quote.price) * 100
      : null;
  const analystCount = grades
    ? grades.strongBuy + grades.buy + grades.hold + grades.sell + grades.strongSell
    : null;
  const interestCoverage = num(ratios?.interestCoverageRatioTTM);
  const tangibleBook = num(ratios?.tangibleBookValuePerShareTTM);
  const priceToTangible =
    quote?.price != null && tangibleBook != null && tangibleBook > 0 ? quote.price / tangibleBook : null;
  const workingCapital =
    num(metrics?.workingCapitalTTM) ??
    (num(sheet?.totalCurrentAssets) != null && num(sheet?.totalCurrentLiabilities) != null
      ? sheet!.totalCurrentAssets - sheet!.totalCurrentLiabilities
      : null);
  const latestTreasury = [...treasury].sort((a, b) => b.date.localeCompare(a.date))[0] ?? null;
  const wacc = estimatedWacc({
    marketCap: quote?.marketCap ?? profile?.marketCap,
    beta: profile?.beta,
    riskFreeYield: latestTreasury?.year10,
    totalDebt: sheet?.totalDebt,
    interestExpense: ttm?.interestExpense,
    taxRate: ratios?.effectiveTaxRateTTM,
  });
  const { lastReported, next } = splitCompanyEarnings(earnings);
  const earningsDate = lastReported?.date ?? next?.date ?? null;
  const nextEarningsDate = next && next.date !== earningsDate ? next.date : null;
  const lastSurprise = earningsSurprise(lastReported);
  const pretaxMargin = derivedTtm?.pretaxProfitMargin ?? num(ratios?.pretaxProfitMarginTTM);
  const ebitMargin = derivedTtm?.ebitMargin ?? num(ratios?.ebitMarginTTM);

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
              { label: "Market Cap", href: `/stocks/${ticker}/market-cap`, value: (
                <span className="inline-flex items-center gap-2">
                  {money(marketCap)}
                  {marketCapYoy != null ? <ChangePercent value={marketCapYoy} alreadyPercent={false} className="text-xs" /> : null}
                </span>
              ) },
              { label: "Enterprise Value", href: `/stocks/${ticker}/enterprise-value`, value: money(enterpriseValue) },
            ]}
          />
        </section>
        <section>
          <h2 className="mb-3 font-semibold text-header">Important Dates</h2>
          <StatGrid
            items={[
              {
                label: "Earnings Date",
                href: `/stocks/${ticker}/earnings`,
                value: (
                  <span className="inline-flex items-center gap-2">
                    {formatDate(earningsDate)}
                    {lastSurprise != null ? <ChangePercent value={lastSurprise} alreadyPercent={false} className="text-xs" /> : null}
                  </span>
                ),
              },
              ...(nextEarningsDate
                ? [{ label: "Next Earnings", href: `/stocks/${ticker}/earnings`, value: formatDate(nextEarningsDate) }]
                : []),
              { label: "Ex-Dividend Date", href: `/stocks/${ticker}/dividend`, value: formatDate(dividends[0]?.date) },
            ]}
          />
        </section>
        <section>
          <h2 className="mb-3 font-semibold text-header">Share Statistics</h2>
          <StatGrid
            items={[
              { label: "Shares Outstanding", href: `/stocks/${ticker}/shares`, value: formatNumber(shares, 0) },
              { label: "Shares Change (YoY)", href: `/stocks/${ticker}/shares`, value: sharesYoy == null ? "—" : <ChangePercent value={sharesYoy} alreadyPercent={false} /> },
              { label: "Shares Change (QoQ)", href: `/stocks/${ticker}/shares`, value: sharesQoq == null ? "—" : <ChangePercent value={sharesQoq} alreadyPercent={false} /> },
              { label: "Float", href: `/stocks/${ticker}/shares`, value: formatNumber(shareFloat?.floatShares, 0) },
              { label: "Free Float", href: `/stocks/${ticker}/shares`, value: formatPercentPlain(shareFloat?.freeFloat, { alreadyPercent: true }) },
              {
                label: "Institutional Ownership",
                href: `/stocks/${ticker}/ownership`,
                value: formatPercentPlain(institutionPct, { alreadyPercent: true }),
              },
            ]}
          />
          {institutionPct != null && institutionPct > 100 ? (
            <p className="mt-2 text-xs text-muted">
              13F ownership can exceed 100% when short interest, options, and overlapping filings are included.
            </p>
          ) : null}
        </section>
        <section>
          <h2 className="mb-3 font-semibold text-header">Valuation Ratios</h2>
          <StatGrid
            items={[
              { label: "PE Ratio", href: `/stocks/${ticker}/pe-ratio`, value: formatRatio(peValue) },
              { label: "Forward PE", href: `/stocks/${ticker}/forward-pe`, value: formatRatio(forwardPeFromEstimates(quote?.price, estimates)) },
              {
                label: "Sector PE",
                href: profile?.sector ? sectorHref(profile.sector) : undefined,
                value: (
                  <span className="inline-flex items-center gap-2">
                    {formatRatio(sectorPe)}
                    {sectorPeVs != null ? (
                      <span className="text-xs text-muted">
                        {formatPercentPlain(Math.abs(sectorPeVs))} {sectorPeVs >= 0 ? "premium" : "discount"}
                      </span>
                    ) : null}
                  </span>
                ),
              },
              {
                label: "Industry PE",
                href: profile?.industry ? industryHref(profile.industry) : undefined,
                value: (
                  <span className="inline-flex items-center gap-2">
                    {formatRatio(industryPe)}
                    {industryPeVs != null ? (
                      <span className="text-xs text-muted">
                        {formatPercentPlain(Math.abs(industryPeVs))} {industryPeVs >= 0 ? "premium" : "discount"}
                      </span>
                    ) : null}
                  </span>
                ),
              },
              { label: "PS Ratio", href: `/stocks/${ticker}/ps-ratio`, value: formatRatio(num(ratios?.priceToSalesRatioTTM)) },
              { label: "Forward PS", href: `/stocks/${ticker}/forward-ps`, value: formatRatio(forwardPs(marketCap, estimates)) },
              { label: "PB Ratio", href: `/stocks/${ticker}/pb-ratio`, value: formatRatio(num(ratios?.priceToBookRatioTTM)) },
              { label: "P/TBV", href: `/stocks/${ticker}/tangible-book-value`, value: formatRatio(priceToTangible) },
              { label: "P/FCF", href: `/stocks/${ticker}/pfcf-ratio`, value: formatRatio(num(ratios?.priceToFreeCashFlowRatioTTM)) },
              { label: "P/OCF", href: `/stocks/${ticker}/pocf-ratio`, value: formatRatio(num(ratios?.priceToOperatingCashFlowRatioTTM)) },
              { label: "PEG Ratio", href: `/stocks/${ticker}/peg-ratio`, value: formatRatio(peg) },
              { label: "Graham Number", href: `/stocks/${ticker}/fair-value`, value: formatMoney(num(metrics?.grahamNumberTTM), currency) },
              { label: "Graham Net-Net", href: `/stocks/${ticker}/fair-value`, value: formatMoney(num(metrics?.grahamNetNetTTM), currency) },
              { label: "Net Debt / EBITDA", href: `/stocks/${ticker}/net-debt-ebitda`, value: formatRatio(num(metrics?.netDebtToEBITDATTM)) },
            ]}
          />
        </section>
        <section>
          <h2 className="mb-3 font-semibold text-header">Enterprise Valuation</h2>
          <StatGrid
            items={[
              { label: "EV / Earnings", href: `/stocks/${ticker}/ev-earnings`, value: formatRatio(
                  enterpriseValue != null && num(ttm?.netIncome) != null && ttm!.netIncome !== 0
                    ? enterpriseValue / ttm!.netIncome
                    : null,
                ) },
              { label: "EV / Sales", href: `/stocks/${ticker}/ev-sales`, value: formatRatio(
                  enterpriseValue != null && num(ttm?.revenue) != null && ttm!.revenue !== 0
                    ? enterpriseValue / ttm!.revenue
                    : num(metrics?.evToSalesTTM),
                ) },
              { label: "EV / EBITDA", href: `/stocks/${ticker}/ev-ebitda`, value: formatRatio(
                  enterpriseValue != null && num(derivedTtm?.ebitda ?? ttm?.ebitda) != null && (derivedTtm?.ebitda ?? ttm?.ebitda) !== 0
                    ? enterpriseValue / (derivedTtm?.ebitda ?? ttm!.ebitda)
                    : num(metrics?.evToEBITDATTM),
                ) },
              {
                label: "EV / EBIT",
                href: `/stocks/${ticker}/ev-ebit`,
                value: formatRatio(
                  enterpriseValue != null && num(derivedTtm?.ebit ?? ttm?.ebit) != null && (derivedTtm?.ebit ?? ttm!.ebit) !== 0
                    ? enterpriseValue / (derivedTtm?.ebit ?? ttm!.ebit)
                    : null,
                ),
              },
              { label: "EV / FCF", href: `/stocks/${ticker}/ev-fcf`, value: formatRatio(
                  enterpriseValue != null && num(cash?.freeCashFlow) != null && cash!.freeCashFlow !== 0
                    ? enterpriseValue / cash!.freeCashFlow
                    : num(metrics?.evToFreeCashFlowTTM),
                ) },
            ]}
          />
        </section>
        <section>
          <h2 className="mb-3 font-semibold text-header">Balance Sheet</h2>
          <StatGrid
            items={[
              { label: "Current Ratio", href: `/stocks/${ticker}/current-ratio`, value: formatRatio(num(ratios?.currentRatioTTM ?? metrics?.currentRatioTTM)) },
              { label: "Quick Ratio", href: `/stocks/${ticker}/quick-ratio`, value: formatRatio(num(ratios?.quickRatioTTM)) },
              { label: "Debt / Equity", href: `/stocks/${ticker}/debt-equity-ratio`, value: formatRatio(num(ratios?.debtToEquityRatioTTM)) },
              {
                label: "Debt / EBITDA",
                href: `/stocks/${ticker}/debt-ebitda`,
                value: formatRatio(
                  totalDebt != null && num(derivedTtm?.ebitda ?? ttm?.ebitda) != null && (derivedTtm?.ebitda ?? ttm?.ebitda) !== 0
                    ? totalDebt / (derivedTtm?.ebitda ?? ttm!.ebitda)
                    : null,
                ),
              },
              {
                label: "Debt / FCF",
                href: `/stocks/${ticker}/debt-fcf`,
                value: formatRatio(debtFcf),
              },
              { label: "Interest Coverage", href: `/stocks/${ticker}/interest-coverage`, value: formatRatio(interestCoverage != null && interestCoverage > 0 ? interestCoverage : null) },
              { label: "Cash & Marketable Securities", href: `/stocks/${ticker}/cash`, value: money(cashAndInvestments) },
              { label: "Total Debt", href: `/stocks/${ticker}/debt`, value: money(totalDebt) },
              { label: "Net Cash", href: `/stocks/${ticker}/net-cash`, value: money(netCash) },
              {
                label: "Net Cash / Share",
                href: `/stocks/${ticker}/net-cash`,
                value: netCash != null && shares ? formatMoney(netCash / shares, currency) : "—",
              },
              { label: "Book Value", href: `/stocks/${ticker}/equity`, value: money(num(sheet?.totalStockholdersEquity)) },
              { label: "Book Value / Share", href: `/stocks/${ticker}/book-value`, value: formatMoney(num(ratios?.bookValuePerShareTTM), currency) },
              { label: "Working Capital", href: `/stocks/${ticker}/working-capital`, value: money(workingCapital) },
              { label: "WACC", href: `/stocks/${ticker}/wacc`, value: formatPercentPlain(wacc?.wacc) },
            ]}
          />
          <p className="mt-2 text-sm">
            <Link href={`/stocks/${ticker}/financials/balance-sheet`} className="text-link hover:underline">
              Full Balance Sheet
            </Link>
          </p>
        </section>
        <section>
          <h2 className="mb-3 font-semibold text-header">Financial Efficiency</h2>
          <StatGrid
            items={[
              { label: "Return on Equity", href: `/stocks/${ticker}/roe`, value: formatPercentPlain(num(metrics?.returnOnEquityTTM)) },
              { label: "Return on Assets", href: `/stocks/${ticker}/roa`, value: formatPercentPlain(num(metrics?.returnOnAssetsTTM)) },
              { label: "Return on Capital", href: `/stocks/${ticker}/roic`, value: formatPercentPlain(num(metrics?.returnOnInvestedCapitalTTM)) },
              { label: "ROCE", href: `/stocks/${ticker}/roce`, value: formatPercentPlain(num(metrics?.returnOnCapitalEmployedTTM)) },
              { label: "Asset Turnover", href: `/stocks/${ticker}/asset-turnover`, value: formatRatio(num(ratios?.assetTurnoverTTM)) },
              { label: "Inventory Turnover", href: `/stocks/${ticker}/inventory-turnover`, value: formatRatio(num(ratios?.inventoryTurnoverTTM)) },
              { label: "Cash Conversion Cycle", href: `/stocks/${ticker}/cash-conversion-cycle`, value: num(metrics?.cashConversionCycleTTM) == null ? "—" : `${formatNumber(num(metrics?.cashConversionCycleTTM), 1)} days` },
              { label: "Days Sales Outstanding", href: `/stocks/${ticker}/days-sales-outstanding`, value: num(metrics?.daysOfSalesOutstandingTTM) == null ? "—" : `${formatNumber(num(metrics?.daysOfSalesOutstandingTTM), 1)} days` },
              { label: "Days Inventory Outstanding", href: `/stocks/${ticker}/days-inventory-outstanding`, value: num(metrics?.daysOfInventoryOutstandingTTM) == null ? "—" : `${formatNumber(num(metrics?.daysOfInventoryOutstandingTTM), 1)} days` },
              { label: "Days Payables Outstanding", href: `/stocks/${ticker}/days-payables-outstanding`, value: num(metrics?.daysOfPayablesOutstandingTTM) == null ? "—" : `${formatNumber(num(metrics?.daysOfPayablesOutstandingTTM), 1)} days` },
              { label: "Employees", href: `/stocks/${ticker}/employees`, value: formatNumber(headcount, 0) },
              {
                label: "Revenue / Employee",
                value: ttm?.revenue && headcount ? money(ttm.revenue / headcount) : "—",
              },
              {
                label: "Profits / Employee",
                value: ttm?.netIncome && headcount ? money(ttm.netIncome / headcount) : "—",
              },
            ]}
          />
        </section>
        <section>
          <h2 className="mb-3 font-semibold text-header">Taxes</h2>
          <StatGrid
            items={[
              { label: "Income Tax", href: `/stocks/${ticker}/income-tax`, value: money(ttm?.incomeTaxExpense) },
              { label: "Effective Tax Rate", href: `/stocks/${ticker}/effective-tax-rate`, value: formatPercentPlain(derivedTtm?.effectiveTaxRate ?? num(ratios?.effectiveTaxRateTTM)) },
            ]}
          />
        </section>
        <section>
          <h2 className="mb-3 font-semibold text-header">Income Statement (ttm)</h2>
          <StatGrid
            items={[
              { label: "Revenue", href: `/stocks/${ticker}/revenue`, value: money(ttm?.revenue) },
              { label: "Cost of Revenue", href: `/stocks/${ticker}/cost-of-revenue`, value: money(ttm?.costOfRevenue) },
              { label: "Gross Profit", href: `/stocks/${ticker}/gross-profit`, value: money(ttm?.grossProfit) },
              { label: "Research & Development", href: `/stocks/${ticker}/research-and-development`, value: money(ttm?.researchAndDevelopmentExpenses) },
              { label: "SG&A", href: `/stocks/${ticker}/sga`, value: money(ttm?.sellingGeneralAndAdministrativeExpenses) },
              { label: "Operating Expenses", href: `/stocks/${ticker}/operating-expenses`, value: money(ttm?.operatingExpenses) },
              { label: "Operating Income", href: `/stocks/${ticker}/operating-income`, value: money(ttm?.operatingIncome) },
              { label: "EBIT", href: `/stocks/${ticker}/ebit`, value: money(derivedTtm?.ebit ?? ttm?.operatingIncome ?? ttm?.ebit) },
              { label: "Pretax Income", href: `/stocks/${ticker}/pretax-income`, value: money(ttm?.incomeBeforeTax) },
              { label: "Net Income", href: `/stocks/${ticker}/net-income`, value: money(ttm?.netIncome) },
              { label: "EBITDA", href: `/stocks/${ticker}/ebitda`, value: money(derivedTtm?.ebitda ?? ttm?.ebitda) },
              { label: "EPS", href: `/stocks/${ticker}/earnings`, value: formatMoney(ttm?.epsDiluted ?? ttm?.eps, currency) },
            ]}
          />
          <p className="mt-2 text-sm">
            <Link href={`/stocks/${ticker}/financials/income-statement`} className="text-link hover:underline">
              Full Income Statement
            </Link>
          </p>
        </section>
        <section>
          <h2 className="mb-3 font-semibold text-header">Cash Flow (ttm)</h2>
          <StatGrid
            items={[
              { label: "Operating Cash Flow", href: `/stocks/${ticker}/operating-cash-flow`, value: money(cash?.operatingCashFlow) },
              { label: "Capital Expenditures", href: `/stocks/${ticker}/capex`, value: money(cash?.capitalExpenditure) },
              { label: "Depreciation & Amortization", href: `/stocks/${ticker}/depreciation-amortization`, value: money(cash?.depreciationAndAmortization) },
              { label: "Net Borrowing", href: `/stocks/${ticker}/net-borrowing`, value: money(cash?.netDebtIssuance) },
              { label: "Free Cash Flow", href: `/stocks/${ticker}/free-cash-flow`, value: money(cash?.freeCashFlow) },
              { label: "FCF / Share", href: `/stocks/${ticker}/free-cash-flow`, value: shares && cash?.freeCashFlow ? formatMoney(cash.freeCashFlow / shares, currency) : "—" },
              { label: "FCF Yield", href: `/stocks/${ticker}/fcf-yield`, value: formatPercentPlain(num(cash?.freeCashFlow) != null && marketCap ? cash!.freeCashFlow / marketCap : num(metrics?.freeCashFlowYieldTTM)) },
            ]}
          />
          <p className="mt-2 text-sm">
            <Link href={`/stocks/${ticker}/financials/cash-flow-statement`} className="text-link hover:underline">
              Full Cash Flow Statement
            </Link>
          </p>
        </section>
        <section>
          <h2 className="mb-3 font-semibold text-header">Margins</h2>
          <StatGrid
            items={[
              { label: "Gross Margin", href: `/stocks/${ticker}/gross-margin`, value: formatPercentPlain(derivedTtm?.grossProfitMargin ?? num(ratios?.grossProfitMarginTTM)) },
              { label: "Operating Margin", href: `/stocks/${ticker}/operating-margin`, value: formatPercentPlain(derivedTtm?.operatingProfitMargin ?? num(ratios?.operatingProfitMarginTTM)) },
              { label: "Pretax Margin", href: `/stocks/${ticker}/pretax-margin`, value: formatPercentPlain(pretaxMargin) },
              { label: "Profit Margin", href: `/stocks/${ticker}/profit-margin`, value: formatPercentPlain(derivedTtm?.netProfitMargin ?? num(ratios?.netProfitMarginTTM)) },
              { label: "EBITDA Margin", href: `/stocks/${ticker}/ebitda-margin`, value: formatPercentPlain(derivedTtm?.ebitdaMargin ?? num(ratios?.ebitdaMarginTTM)) },
              { label: "EBIT Margin", href: `/stocks/${ticker}/ebit-margin`, value: formatPercentPlain(ebitMargin) },
              { label: "FCF Margin", href: `/stocks/${ticker}/fcf-margin`, value: formatPercentPlain(derivedTtm?.fcfMargin ?? fcfMargin) },
            ]}
          />
        </section>
        <section>
          <h2 className="mb-3 font-semibold text-header">Dividends & Yields</h2>
          <StatGrid
            items={[
              { label: "Dividend", href: `/stocks/${ticker}/dividend`, value: formatMoney(indicatedAnnualDividend(dividends[0], profile?.lastDividend), currency) },
              { label: "Dividend Yield", href: `/stocks/${ticker}/dividend-yield`, value: formatPercentPlain(dividendYield) },
              { label: "Dividend Growth (1Y)", href: `/stocks/${ticker}/dividend`, value: formatPercentPlain(dpsGrowth) },
              { label: "Years of Dividend Growth", href: `/stocks/${ticker}/dividend`, value: dividendGrowthYears > 0 ? formatNumber(dividendGrowthYears, 0) : "—" },
              { label: "Payout Ratio", href: `/stocks/${ticker}/payout-ratio`, value: formatPercentPlain(num(ratios?.dividendPayoutRatioTTM)) },
              { label: "Buyback Yield", href: `/stocks/${ticker}/buybacks`, value: formatPercentPlain(buybackYield) },
              { label: "Shareholder Yield", href: `/stocks/${ticker}/buybacks`, value: formatPercentPlain(shareholderYield) },
              { label: "Earnings Yield", href: `/stocks/${ticker}/earnings-yield`, value: formatPercentPlain(peValue && peValue > 0 ? 1 / peValue : num(metrics?.earningsYieldTTM)) },
              { label: "FCF Yield", href: `/stocks/${ticker}/fcf-yield`, value: formatPercentPlain(num(cash?.freeCashFlow) != null && marketCap ? cash!.freeCashFlow / marketCap : num(metrics?.freeCashFlowYieldTTM)) },
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
              { label: "EMA (12)", value: formatMoney(ema12?.ema, currency) },
              { label: "EMA (26)", value: formatMoney(ema26?.ema, currency) },
              { label: "RSI (14)", value: formatNumber(rsi?.rsi) },
              { label: "Average Volume", value: formatNumber(quote?.avgVolume ?? profile?.averageVolume, 0) },
            ]}
          />
        </section>
        <section>
          <h2 className="mb-3 font-semibold text-header">Analyst Forecast</h2>
          <StatGrid
            items={[
              { label: "Price Target", href: `/stocks/${ticker}/forecast`, value: target ? formatMoney(target.targetConsensus, currency) : "—" },
              {
                label: "Target Upside",
                href: `/stocks/${ticker}/forecast`,
                value: targetUpside == null ? "—" : `${targetUpside > 0 ? "+" : ""}${targetUpside.toFixed(2)}%`,
              },
              { label: "Consensus", href: `/stocks/${ticker}/ratings`, value: grades?.consensus ?? "—" },
              { label: "Analyst Count", href: `/stocks/${ticker}/ratings`, value: analystCount ? formatNumber(analystCount, 0) : "—" },
              { label: "Revenue Growth Forecast (3Y)", value: formatPercentPlain(revenueCagr) },
              { label: "EPS Growth Forecast (3Y)", value: formatPercentPlain(epsCagr) },
            ]}
          />
        </section>
        <section>
          <h2 className="mb-3 font-semibold text-header">Fair Value</h2>
          <StatGrid
            items={[
              { label: "DCF Fair Value", href: `/stocks/${ticker}/fair-value`, value: dcfPrice != null ? formatMoney(dcfPrice, currency) : "—" },
              {
                label: "DCF Upside",
                href: `/stocks/${ticker}/fair-value`,
                value: dcfUpside == null ? "—" : `${dcfUpside > 0 ? "+" : ""}${dcfUpside.toFixed(1)}%`,
              },
              { label: "Lynch Fair Value", href: `/stocks/${ticker}/fair-value`, value: lynchValue != null ? formatMoney(lynchValue, currency) : "—" },
              {
                label: "Lynch Upside",
                href: `/stocks/${ticker}/fair-value`,
                value: lynchUpside == null ? "—" : `${lynchUpside > 0 ? "+" : ""}${(lynchUpside * 100).toFixed(1)}%`,
              },
              { label: "Graham Number", href: `/stocks/${ticker}/fair-value`, value: formatMoney(num(metrics?.grahamNumberTTM), currency) },
              {
                label: "Graham Upside",
                href: `/stocks/${ticker}/fair-value`,
                value:
                  num(metrics?.grahamNumberTTM) != null && quote?.price
                    ? `${(((num(metrics?.grahamNumberTTM)! - quote.price) / quote.price) * 100).toFixed(1)}%`
                    : "—",
              },
              { label: "FMP Rating", href: `/stocks/${ticker}/forecast`, value: ratings?.rating ?? "—" },
            ]}
          />
        </section>
        <section>
          <h2 className="mb-3 font-semibold text-header">Stock Splits</h2>
          <StatGrid
            items={[
              { label: "Last Split Date", href: `/stocks/${ticker}/splits`, value: formatDate(lastSplit?.date) },
              {
                label: "Split Ratio",
                href: `/stocks/${ticker}/splits`,
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
        {cik || isin || cusip ? (
          <section>
            <h2 className="mb-3 font-semibold text-header">Identifiers</h2>
            <StatGrid
              items={[
                {
                  label: "CIK",
                  value: cik ? (
                    <Link href={`/search?q=${encodeURIComponent(cik)}`} className="text-link hover:underline">
                      {cik}
                    </Link>
                  ) : (
                    "—"
                  ),
                },
                {
                  label: "ISIN",
                  value: isin ? (
                    <Link href={`/search?q=${encodeURIComponent(isin)}`} className="text-link hover:underline">
                      {isin}
                    </Link>
                  ) : (
                    "—"
                  ),
                },
                {
                  label: "CUSIP",
                  value: cusip ? (
                    <Link href={`/search?q=${encodeURIComponent(cusip)}`} className="text-link hover:underline">
                      {cusip}
                    </Link>
                  ) : (
                    "—"
                  ),
                },
              ]}
            />
          </section>
        ) : null}
      </div>
    </Container>
  );
}
