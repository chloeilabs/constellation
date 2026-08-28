import { yearOverYear } from "@/lib/format";
import { stockPath } from "@/lib/listings";
import type { FmpRevenueSegment } from "@/lib/types";
import { netCashPosition } from "@/lib/utils";

export type StatementRow = {
  key: string;
  label: string;
  indent?: number;
  emphasize?: boolean;
  href?: string;
  zeroAsEmpty?: boolean;
  format?: "money" | "share" | "eps" | "ratio" | "percent" | "number" | "growth";
};

export const INCOME_ROWS: StatementRow[] = [
  { key: "revenue", label: "Revenue", emphasize: true, format: "money" },
  { key: "costOfRevenue", label: "Cost of Revenue", format: "money" },
  { key: "grossProfit", label: "Gross Profit", emphasize: true, format: "money" },
  { key: "researchAndDevelopmentExpenses", label: "Research and Development", indent: 1, format: "money" },
  {
    key: "sellingGeneralAndAdministrativeExpenses",
    label: "Selling, General & Admin",
    indent: 1,
    format: "money",
  },
  { key: "operatingExpenses", label: "Operating Expenses", format: "money" },
  { key: "operatingIncome", label: "Operating Income", emphasize: true, format: "money" },
  { key: "interestIncome", label: "Interest Income", indent: 1, format: "money", zeroAsEmpty: true },
  { key: "interestExpense", label: "Interest Expense", indent: 1, format: "money", zeroAsEmpty: true },
  { key: "totalOtherIncomeExpensesNet", label: "Other Income / Expense", format: "money" },
  { key: "incomeBeforeTax", label: "Pretax Income", emphasize: true, format: "money" },
  { key: "incomeTaxExpense", label: "Income Tax", format: "money" },
  { key: "netIncome", label: "Net Income", emphasize: true, format: "money" },
  { key: "eps", label: "EPS (Basic)", format: "eps" },
  { key: "epsDiluted", label: "EPS (Diluted)", format: "eps" },
  { key: "weightedAverageShsOut", label: "Shares Outstanding (Basic)", format: "share" },
  { key: "weightedAverageShsOutDil", label: "Shares Outstanding (Diluted)", format: "share" },
  { key: "ebitda", label: "EBITDA", format: "money" },
];

/** Extra lines Stock Analysis shows under the income statement. */
export const ADDITIONAL_INCOME_ROWS: StatementRow[] = [
  { key: "freeCashFlow", label: "Free Cash Flow", emphasize: true, format: "money" },
  { key: "fcfPerShare", label: "Free Cash Flow Per Share", format: "eps" },
  { key: "dividendPerShare", label: "Dividend Per Share", format: "eps" },
  { key: "dividendGrowth", label: "Dividend Growth", format: "percent" },
  { key: "grossProfitMargin", label: "Gross Margin", format: "percent" },
  { key: "operatingProfitMargin", label: "Operating Margin", format: "percent" },
  { key: "netProfitMargin", label: "Profit Margin", format: "percent" },
  { key: "fcfMargin", label: "Free Cash Flow Margin", format: "percent" },
  { key: "ebitda", label: "EBITDA", format: "money" },
  { key: "ebitdaMargin", label: "EBITDA Margin", format: "percent" },
  { key: "depreciationAndAmortization", label: "D&A For EBITDA", format: "money" },
  { key: "ebit", label: "EBIT", format: "money" },
  { key: "ebitMargin", label: "EBIT Margin", format: "percent" },
  { key: "pretaxProfitMargin", label: "Pretax Margin", format: "percent" },
  { key: "effectiveTaxRate", label: "Effective Tax Rate", format: "percent" },
  { key: "revenueAsReported", label: "Revenue as Reported", format: "money" },
];

/** Mixed actual + consensus estimate rows for the quote forecast table. */
export const FORECAST_ROWS: StatementRow[] = [
  { key: "revenue", label: "Revenue", emphasize: true, format: "money" },
  { key: "revenueGrowth", label: "Revenue Growth", format: "percent" },
  { key: "grossProfit", label: "Gross Profit", format: "money" },
  { key: "grossProfitMargin", label: "Gross Margin", format: "percent" },
  { key: "operatingIncome", label: "Operating Income", format: "money" },
  { key: "netIncome", label: "Net Income", emphasize: true, format: "money" },
  { key: "eps", label: "EPS", format: "eps" },
  { key: "epsGrowth", label: "EPS Growth", format: "percent" },
  { key: "forwardPe", label: "Forward PE", format: "ratio" },
  { key: "dividendPerShare", label: "Dividend / Share", format: "eps" },
  { key: "dividendGrowth", label: "Dividend Growth", format: "percent" },
  { key: "freeCashFlow", label: "Free Cash Flow", format: "money" },
  { key: "analysts", label: "No. Analysts", format: "number" },
];

export const STATEMENT_METRIC_HREFS: Record<string, string> = {
  revenue: "revenue",
  costOfRevenue: "cost-of-revenue",
  grossProfit: "gross-profit",
  researchAndDevelopmentExpenses: "research-and-development",
  sellingGeneralAndAdministrativeExpenses: "sga",
  operatingExpenses: "operating-expenses",
  operatingIncome: "operating-income",
  interestIncome: "interest-income",
  interestExpense: "interest-expense",
  incomeBeforeTax: "pretax-income",
  incomeTaxExpense: "income-tax",
  netIncome: "net-income",
  epsDiluted: "earnings",
  eps: "earnings",
  ebitda: "ebitda",
  ebit: "ebit",
  freeCashFlow: "free-cash-flow",
  netCashProvidedByOperatingActivities: "operating-cash-flow",
  operatingCashFlow: "operating-cash-flow",
  investmentsInPropertyPlantAndEquipment: "capex",
  capitalExpenditure: "capex",
  depreciationAndAmortization: "depreciation-amortization",
  commonStockRepurchased: "buybacks",
  netDebtIssuance: "net-borrowing",
  grossProfitMargin: "gross-margin",
  operatingProfitMargin: "operating-margin",
  netProfitMargin: "profit-margin",
  fcfMargin: "fcf-margin",
  ebitdaMargin: "ebitda-margin",
  ebitMargin: "ebit-margin",
  pretaxProfitMargin: "pretax-margin",
  effectiveTaxRate: "effective-tax-rate",
  fcfPerShare: "free-cash-flow",
  dividendPerShare: "dividend",
  dividendGrowth: "dividend",
  forwardPe: "forward-pe",
  revenueGrowth: "revenue",
  epsGrowth: "earnings",
  revenueAsReported: "revenue",
  cashAndCashEquivalents: "cash",
  cashAndShortTermInvestments: "cash",
  totalAssets: "assets",
  totalLiabilities: "liabilities",
  totalStockholdersEquity: "equity",
  totalDebt: "debt",
  netCashPosition: "net-cash",
  netCashPerShare: "net-cash",
  workingCapital: "working-capital",
  bookValuePerShare: "book-value",
  tangibleBookValue: "tangible-book-value",
  tangibleBookValuePerShare: "tangible-book-value",
  weightedAverageShsOutDil: "shares",
  assetTurnover: "asset-turnover",
  inventoryTurnover: "inventory-turnover",
  returnOnInvestedCapital: "roic",
  returnOnCapitalEmployed: "roce",
  returnOnEquity: "roe",
  returnOnAssets: "roa",
  earningsYield: "earnings-yield",
  freeCashFlowYield: "fcf-yield",
  netDebtToEBITDA: "net-debt-ebitda",
  netDebtToEquity: "net-cash",
  netDebtToFcf: "debt-fcf",
  priceToEarningsGrowthRatio: "peg-ratio",
  priceToEarningsRatio: "pe-ratio",
  priceToSalesRatio: "ps-ratio",
  priceToBookRatio: "pb-ratio",
  priceToTangibleBookRatio: "tangible-book-value",
  priceToFreeCashFlowRatio: "pfcf-ratio",
  priceToOperatingCashFlowRatio: "pocf-ratio",
  marketCap: "market-cap",
  marketCapGrowth: "market-cap",
  enterpriseValue: "enterprise-value",
  evToSales: "ev-sales",
  evToEBITDA: "ev-ebitda",
  evToEBIT: "ev-ebit",
  evToFreeCashFlow: "ev-fcf",
  debtToEquityRatio: "debt-equity-ratio",
  debtToEbitda: "debt-ebitda",
  debtToFcf: "debt-fcf",
  currentRatio: "current-ratio",
  quickRatio: "quick-ratio",
  dividendYield: "dividend-yield",
  dividendPayoutRatio: "payout-ratio",
  buybackYield: "buybacks",
  shareholderYield: "buybacks",
};

export function withStatementHrefs(rows: StatementRow[], symbol: string): StatementRow[] {
  return rows.map((row) => {
    const slug = STATEMENT_METRIC_HREFS[row.key];
    return slug ? { ...row, href: stockPath(symbol, `/${slug}`) } : row;
  });
}

export const BALANCE_ROWS: StatementRow[] = [
  { key: "cashAndCashEquivalents", label: "Cash & Equivalents", format: "money" },
  { key: "shortTermInvestments", label: "Short-Term Investments", format: "money" },
  { key: "cashAndShortTermInvestments", label: "Cash & Short-Term Investments", emphasize: true, format: "money" },
  { key: "netReceivables", label: "Receivables", format: "money" },
  { key: "inventory", label: "Inventory", format: "money" },
  { key: "totalCurrentAssets", label: "Total Current Assets", emphasize: true, format: "money" },
  { key: "propertyPlantEquipmentNet", label: "Property, Plant & Equipment", format: "money" },
  { key: "goodwill", label: "Goodwill", format: "money" },
  { key: "longTermInvestments", label: "Long-Term Investments", format: "money" },
  { key: "totalNonCurrentAssets", label: "Total Non-Current Assets", emphasize: true, format: "money" },
  { key: "totalAssets", label: "Total Assets", emphasize: true, format: "money" },
  { key: "accountPayables", label: "Accounts Payable", format: "money" },
  { key: "shortTermDebt", label: "Short-Term Debt", format: "money" },
  { key: "deferredRevenue", label: "Deferred Revenue", format: "money" },
  { key: "totalCurrentLiabilities", label: "Total Current Liabilities", emphasize: true, format: "money" },
  { key: "longTermDebt", label: "Long-Term Debt", format: "money" },
  { key: "totalNonCurrentLiabilities", label: "Total Non-Current Liabilities", emphasize: true, format: "money" },
  { key: "totalLiabilities", label: "Total Liabilities", emphasize: true, format: "money" },
  { key: "commonStock", label: "Common Stock", format: "money" },
  { key: "retainedEarnings", label: "Retained Earnings", format: "money" },
  { key: "totalStockholdersEquity", label: "Shareholders' Equity", emphasize: true, format: "money" },
  { key: "totalDebt", label: "Total Debt", format: "money" },
  { key: "netDebt", label: "Net Debt", format: "money" },
];

/** Supplemental lines Stock Analysis shows under the balance sheet. */
export const ADDITIONAL_BALANCE_ROWS: StatementRow[] = [
  { key: "totalDebt", label: "Total Debt", format: "money" },
  { key: "netCashPosition", label: "Net Cash (Debt)", format: "money" },
  { key: "netCashGrowth", label: "Net Cash Growth", format: "percent" },
  { key: "netCashPerShare", label: "Net Cash Per Share", format: "eps" },
  { key: "weightedAverageShsOutDil", label: "Shares Outstanding (Diluted)", format: "share" },
  { key: "workingCapital", label: "Working Capital", format: "money" },
  { key: "bookValuePerShare", label: "Book Value Per Share", format: "eps" },
  { key: "tangibleBookValue", label: "Tangible Book Value", format: "money" },
  { key: "tangibleBookValuePerShare", label: "Tangible Book Value Per Share", format: "eps" },
];

export const CASH_FLOW_ROWS: StatementRow[] = [
  { key: "netIncome", label: "Net Income", format: "money" },
  { key: "depreciationAndAmortization", label: "Depreciation & Amortization", format: "money" },
  { key: "stockBasedCompensation", label: "Stock-Based Compensation", format: "money" },
  { key: "changeInWorkingCapital", label: "Change in Working Capital", format: "money" },
  {
    key: "netCashProvidedByOperatingActivities",
    label: "Operating Cash Flow",
    emphasize: true,
    format: "money",
  },
  { key: "investmentsInPropertyPlantAndEquipment", label: "Capital Expenditures", format: "money" },
  { key: "acquisitionsNet", label: "Acquisitions", format: "money" },
  { key: "purchasesOfInvestments", label: "Purchases of Investments", format: "money" },
  { key: "salesMaturitiesOfInvestments", label: "Sales / Maturities of Investments", format: "money" },
  {
    key: "netCashProvidedByInvestingActivities",
    label: "Investing Cash Flow",
    emphasize: true,
    format: "money",
  },
  { key: "netDebtIssuance", label: "Debt Issued / Repaid", format: "money" },
  { key: "commonStockRepurchased", label: "Share Repurchases", format: "money" },
  { key: "netDividendsPaid", label: "Dividends Paid", format: "money" },
  {
    key: "netCashProvidedByFinancingActivities",
    label: "Financing Cash Flow",
    emphasize: true,
    format: "money",
  },
  { key: "netChangeInCash", label: "Net Change in Cash", format: "money" },
  { key: "freeCashFlow", label: "Free Cash Flow", emphasize: true, format: "money" },
];

/** Supplemental cash lines Stock Analysis shows under the cash-flow statement. */
export const ADDITIONAL_CASH_ROWS: StatementRow[] = [
  { key: "interestPaid", label: "Cash Interest Paid", format: "money", zeroAsEmpty: true },
  { key: "incomeTaxesPaid", label: "Cash Income Tax Paid", format: "money" },
  { key: "changeInWorkingCapital", label: "Change in Working Capital", format: "money" },
];

export type RatioSection = {
  id: string;
  title: string;
  rows: StatementRow[];
  scale?: "millions";
  inlineYoy?: boolean;
};

export const RATIO_SECTIONS: RatioSection[] = [
  {
    id: "valuation",
    title: "Total Valuation",
    scale: "millions",
    inlineYoy: false,
    rows: [
      { key: "marketCap", label: "Market Capitalization", emphasize: true, format: "money" },
      { key: "marketCapGrowth", label: "Market Cap Growth", format: "percent" },
      { key: "enterpriseValue", label: "Enterprise Value", emphasize: true, format: "money" },
      { key: "lastClosePrice", label: "Last Close Price", format: "eps" },
    ],
  },
  {
    id: "price",
    title: "Price Ratios",
    rows: [
      { key: "priceToEarningsRatio", label: "PE Ratio", format: "ratio" },
      { key: "forwardPe", label: "Forward PE", format: "ratio" },
      { key: "priceToSalesRatio", label: "PS Ratio", format: "ratio" },
      { key: "priceToBookRatio", label: "PB Ratio", format: "ratio" },
      { key: "priceToTangibleBookRatio", label: "P/TBV Ratio", format: "ratio" },
      { key: "priceToFreeCashFlowRatio", label: "P/FCF Ratio", format: "ratio" },
      { key: "priceToOperatingCashFlowRatio", label: "P/OCF Ratio", format: "ratio" },
      { key: "priceToEarningsGrowthRatio", label: "PEG Ratio", format: "ratio" },
    ],
  },
  {
    id: "ev",
    title: "EV Ratios",
    rows: [
      { key: "evToSales", label: "EV / Sales", format: "ratio" },
      { key: "evToEBITDA", label: "EV / EBITDA", format: "ratio" },
      { key: "evToEBIT", label: "EV / EBIT", format: "ratio" },
      { key: "evToFreeCashFlow", label: "EV / FCF", format: "ratio" },
    ],
  },
  {
    id: "efficiency",
    title: "Financial Efficiency",
    rows: [
      { key: "debtToEquityRatio", label: "Debt / Equity", format: "ratio" },
      { key: "debtToEbitda", label: "Debt / EBITDA", format: "ratio" },
      { key: "debtToFcf", label: "Debt / FCF", format: "ratio" },
      { key: "netDebtToEquity", label: "Net Debt / Equity", format: "ratio" },
      { key: "netDebtToEBITDA", label: "Net Debt / EBITDA", format: "ratio" },
      { key: "netDebtToFcf", label: "Net Debt / FCF", format: "ratio" },
      { key: "assetTurnover", label: "Asset Turnover", format: "ratio" },
      { key: "inventoryTurnover", label: "Inventory Turnover", format: "ratio" },
      { key: "quickRatio", label: "Quick Ratio", format: "ratio" },
      { key: "currentRatio", label: "Current Ratio", format: "ratio" },
      { key: "returnOnEquity", label: "Return on Equity (ROE)", format: "percent" },
      { key: "returnOnAssets", label: "Return on Assets (ROA)", format: "percent" },
      { key: "returnOnInvestedCapital", label: "Return on Invested Capital (ROIC)", format: "percent" },
      { key: "returnOnCapitalEmployed", label: "Return on Capital Employed (ROCE)", format: "percent" },
    ],
  },
  {
    id: "yields",
    title: "Yields",
    rows: [
      { key: "earningsYield", label: "Earnings Yield", format: "percent" },
      { key: "freeCashFlowYield", label: "FCF Yield", format: "percent" },
      { key: "dividendYield", label: "Dividend Yield", format: "percent" },
      { key: "dividendPayoutRatio", label: "Payout Ratio", format: "percent" },
      { key: "buybackYield", label: "Buyback Yield / Dilution", format: "percent" },
      { key: "shareholderYield", label: "Total Shareholder Return", format: "percent" },
    ],
  },
];

export const RATIO_ROWS: StatementRow[] = RATIO_SECTIONS.flatMap((section) => section.rows);

export const GROWTH_ROWS: StatementRow[] = [
  { key: "revenueGrowth", label: "Revenue Growth", emphasize: true, format: "percent" },
  { key: "grossProfitGrowth", label: "Gross Profit Growth", format: "percent" },
  { key: "operatingIncomeGrowth", label: "Operating Income Growth", format: "percent" },
  { key: "netIncomeGrowth", label: "Net Income Growth", emphasize: true, format: "percent" },
  { key: "epsdilutedGrowth", label: "EPS Growth (Diluted)", format: "percent" },
  { key: "ebitdaGrowth", label: "EBITDA Growth", format: "percent" },
  { key: "operatingCashFlowGrowth", label: "Operating Cash Flow Growth", format: "percent" },
  { key: "freeCashFlowGrowth", label: "Free Cash Flow Growth", emphasize: true, format: "percent" },
  { key: "assetGrowth", label: "Asset Growth", format: "percent" },
  { key: "bookValueperShareGrowth", label: "Book Value / Share Growth", format: "percent" },
  { key: "debtGrowth", label: "Debt Growth", format: "percent" },
  { key: "receivablesGrowth", label: "Receivables Growth", format: "percent" },
  { key: "inventoryGrowth", label: "Inventory Growth", format: "percent" },
  { key: "weightedAverageSharesDilutedGrowth", label: "Diluted Shares Growth", format: "percent" },
  { key: "dividendsPerShareGrowth", label: "Dividend / Share Growth", format: "percent" },
  { key: "rdexpenseGrowth", label: "R&D Growth", format: "percent" },
  { key: "sgaexpensesGrowth", label: "SG&A Growth", format: "percent" },
  { key: "threeYRevenueGrowthPerShare", label: "3Y Revenue / Share", format: "percent" },
  { key: "fiveYRevenueGrowthPerShare", label: "5Y Revenue / Share", format: "percent" },
  { key: "tenYRevenueGrowthPerShare", label: "10Y Revenue / Share", format: "percent" },
  { key: "threeYNetIncomeGrowthPerShare", label: "3Y Net Income / Share", format: "percent" },
  { key: "fiveYNetIncomeGrowthPerShare", label: "5Y Net Income / Share", format: "percent" },
  { key: "tenYNetIncomeGrowthPerShare", label: "10Y Net Income / Share", format: "percent" },
  { key: "threeYOperatingCFGrowthPerShare", label: "3Y Operating CF / Share", format: "percent" },
  { key: "fiveYOperatingCFGrowthPerShare", label: "5Y Operating CF / Share", format: "percent" },
  { key: "tenYOperatingCFGrowthPerShare", label: "10Y Operating CF / Share", format: "percent" },
  { key: "threeYShareholdersEquityGrowthPerShare", label: "3Y Equity / Share", format: "percent" },
  { key: "fiveYShareholdersEquityGrowthPerShare", label: "5Y Equity / Share", format: "percent" },
  { key: "tenYShareholdersEquityGrowthPerShare", label: "10Y Equity / Share", format: "percent" },
];

export const KEY_METRIC_ROWS: StatementRow[] = [
  { key: "marketCap", label: "Market Cap", emphasize: true, format: "money" },
  { key: "enterpriseValue", label: "Enterprise Value", emphasize: true, format: "money" },
  { key: "evToSales", label: "EV / Sales", format: "ratio" },
  { key: "evToEBITDA", label: "EV / EBITDA", format: "ratio" },
  { key: "evToOperatingCashFlow", label: "EV / Operating CF", format: "ratio" },
  { key: "evToFreeCashFlow", label: "EV / FCF", format: "ratio" },
  { key: "netDebtToEBITDA", label: "Net Debt / EBITDA", format: "ratio" },
  { key: "currentRatio", label: "Current Ratio", format: "ratio" },
  { key: "returnOnAssets", label: "Return on Assets", format: "percent" },
  { key: "returnOnEquity", label: "Return on Equity", format: "percent" },
  { key: "returnOnInvestedCapital", label: "Return on Invested Capital", format: "percent" },
  { key: "returnOnCapitalEmployed", label: "Return on Capital Employed", format: "percent" },
  { key: "earningsYield", label: "Earnings Yield", format: "percent" },
  { key: "freeCashFlowYield", label: "FCF Yield", format: "percent" },
  { key: "grahamNumber", label: "Graham Number", format: "eps" },
  { key: "grahamNetNet", label: "Graham Net-Net", format: "eps" },
  { key: "workingCapital", label: "Working Capital", format: "money" },
  { key: "investedCapital", label: "Invested Capital", format: "money" },
  { key: "freeCashFlowToEquity", label: "FCFE", format: "money" },
  { key: "incomeQuality", label: "Income Quality", format: "ratio" },
  { key: "capexToRevenue", label: "Capex / Revenue", format: "percent" },
  { key: "stockBasedCompensationToRevenue", label: "SBC / Revenue", format: "percent" },
  { key: "researchAndDevelopementToRevenue", label: "R&D / Revenue", format: "percent" },
  { key: "operatingCycle", label: "Operating Cycle", format: "number" },
  { key: "cashConversionCycle", label: "Cash Conversion Cycle", format: "number" },
  { key: "daysOfSalesOutstanding", label: "Days Sales Outstanding", format: "number" },
  { key: "daysOfInventoryOutstanding", label: "Days Inventory Outstanding", format: "number" },
  { key: "daysOfPayablesOutstanding", label: "Days Payables Outstanding", format: "number" },
];

export const INDEX_LABELS: Record<string, string> = {
  "^GSPC": "S&P 500",
  "^DJI": "Dow Jones",
  "^IXIC": "Nasdaq",
  "^NDX": "Nasdaq 100",
  "^RUT": "Russell 2000",
  "^VIX": "VIX",
  "^N225": "Nikkei 225",
  "^FTSE": "FTSE 100",
  "^GDAXI": "DAX",
  "^FCHI": "CAC 40",
  "^STOXX50E": "Euro Stoxx 50",
  "^SSMI": "SMI",
  "^HSI": "Hang Seng",
  "^AXJO": "S&P/ASX 200",
  "^GSPTSE": "S&P/TSX",
  "^BVSP": "Bovespa",
  "^KS11": "KOSPI",
  "^TWII": "TAIEX",
  "^BSESN": "BSE Sensex",
  "^MXX": "IPC Mexico",
  "^STI": "STI",
  "^JKSE": "Jakarta Composite",
};

export function trailingSum(rows: Array<Record<string, unknown>>, field: string, start = 0, count = 4) {
  const slice = rows.slice(start, start + count);
  if (slice.length < count) return null;
  let total = 0;
  for (const row of slice) {
    const value = row[field];
    if (typeof value !== "number" || !Number.isFinite(value)) return null;
    total += value;
  }
  return total;
}

export function toTrailingColumns(
  rows: Array<{ date: string; fiscalYear: string; period: string } & Record<string, unknown>>,
  limit: number,
  sumKeys: string[],
  latestKeys: string[] = [],
) {
  const columns: { key: string; label: string; values: Record<string, unknown> }[] = [];
  for (let i = 0; i < limit; i++) {
    if (rows.length < i + 4) break;
    const end = rows[i];
    const values: Record<string, unknown> = {
      date: end.date,
      fiscalYear: end.fiscalYear,
      period: end.period,
    };
    for (const key of sumKeys) {
      values[key] = trailingSum(rows, key, i);
    }
    for (const key of latestKeys) {
      const value = rows[i][key];
      values[key] = typeof value === "number" && Number.isFinite(value) ? value : null;
    }
    columns.push({
      key: `ttm-${end.date}-${end.period}`,
      label: `${end.period} ${end.fiscalYear}`,
      values,
    });
  }
  return columns;
}

export function derivedStatementMetrics(values: Record<string, unknown>) {
  const n = (key: string) =>
    typeof values[key] === "number" && Number.isFinite(values[key] as number) ? (values[key] as number) : null;
  const revenue = n("revenue");
  const pretax = n("incomeBeforeTax");
  const fcf = n("freeCashFlow");
  const shares = n("weightedAverageShsOutDil");
  const ebit = n("operatingIncome") ?? n("ebit");
  const da = n("depreciationAndAmortization");
  const ebitda = ebit != null && da != null ? ebit + da : n("ebitda");
  const tax = n("incomeTaxExpense");
  const gross = n("grossProfit");
  const operating = n("operatingIncome");
  const net = n("netIncome");
  return {
    ebit,
    ebitda,
    revenueAsReported: revenue,
    fcfPerShare: fcf != null && shares && shares > 0 ? fcf / shares : null,
    grossProfitMargin: revenue && gross != null ? gross / revenue : null,
    operatingProfitMargin: revenue && operating != null ? operating / revenue : null,
    netProfitMargin: revenue && net != null ? net / revenue : null,
    fcfMargin: revenue && fcf != null ? fcf / revenue : null,
    ebitdaMargin: revenue && ebitda != null ? ebitda / revenue : null,
    ebitMargin: revenue && ebit != null ? ebit / revenue : null,
    pretaxProfitMargin: revenue && pretax != null ? pretax / revenue : null,
    effectiveTaxRate: pretax && pretax !== 0 && tax != null ? tax / pretax : null,
  };
}

export function mergeStatementValues(
  columns: { key: string; label: string; values: Record<string, unknown> }[],
  extras: Array<{ date?: string; fiscalYear?: string } & Record<string, unknown>>,
  keys: string[],
  by: "date" | "fiscalYear" = "date",
) {
  const lookup = new Map(
    extras.map((row) => [by === "date" ? String(row.date ?? "") : String(row.fiscalYear ?? ""), row]),
  );
  return columns.map((column) => {
    const match = lookup.get(by === "date" ? String(column.values.date ?? "") : String(column.values.fiscalYear ?? ""));
    if (!match) return column;
    const values = { ...column.values };
    for (const key of keys) {
      const value = match[key];
      if (typeof value === "number" && Number.isFinite(value)) values[key] = value;
    }
    return { ...column, values };
  });
}

export function withDerivedStatementMetrics(
  columns: { key: string; label: string; values: Record<string, unknown> }[],
) {
  return columns.map((column) => ({
    ...column,
    values: { ...column.values, ...derivedStatementMetrics(column.values) },
  }));
}

export function derivedBalanceMetrics(values: Record<string, unknown>) {
  const n = (key: string) =>
    typeof values[key] === "number" && Number.isFinite(values[key] as number) ? (values[key] as number) : null;
  const netCash = netCashPosition({
    cashAndShortTermInvestments: n("cashAndShortTermInvestments") ?? undefined,
    longTermInvestments: n("longTermInvestments") ?? undefined,
    totalDebt: n("totalDebt") ?? undefined,
  });
  const currentAssets = n("totalCurrentAssets");
  const currentLiabilities = n("totalCurrentLiabilities");
  const equity = n("totalStockholdersEquity");
  const goodwill = n("goodwill") ?? 0;
  const intangibles = n("intangibleAssets") ?? 0;
  const tangible = equity != null ? equity - goodwill - intangibles : null;
  const shares = n("weightedAverageShsOutDil") ?? n("weightedAverageShsOut");
  return {
    netCashPosition: netCash,
    netCashPerShare: netCash != null && shares && shares > 0 ? netCash / shares : null,
    workingCapital:
      currentAssets != null && currentLiabilities != null ? currentAssets - currentLiabilities : null,
    bookValuePerShare: equity != null && shares && shares > 0 ? equity / shares : null,
    tangibleBookValue: tangible,
    tangibleBookValuePerShare: tangible != null && shares && shares > 0 ? tangible / shares : null,
  };
}

export function withDerivedBalanceMetrics(
  columns: { key: string; label: string; values: Record<string, unknown> }[],
) {
  return columns.map((column) => ({
    ...column,
    values: { ...column.values, ...derivedBalanceMetrics(column.values) },
  }));
}

export const INCOME_TRAILING_SUM_KEYS = INCOME_ROWS.filter(
  (row) => row.format === "money" || row.format === "eps",
).map((row) => row.key);
export const INCOME_TRAILING_LATEST_KEYS = INCOME_ROWS.filter((row) => row.format === "share").map((row) => row.key);
export const CASH_TRAILING_SUM_KEYS = [
  ...CASH_FLOW_ROWS.filter((row) => row.format === "money").map((row) => row.key),
  "interestPaid",
  "incomeTaxesPaid",
];

export function withAdjacentGrowth(
  columns: { key: string; label: string; values: Record<string, unknown> }[],
  sourceKey: string,
  destKey: string,
  offset = 1,
  ttmOverride?: number | null,
) {
  return columns.map((column, index) => {
    const isTtm = column.key === "ttm" || column.label === "TTM";
    const growth =
      isTtm && ttmOverride != null
        ? ttmOverride
        : yearOverYear(column.values[sourceKey], columns[index + offset]?.values[sourceKey]);
    return { ...column, values: { ...column.values, [destKey]: growth } };
  });
}

/**
 * FMP sometimes stores a Q4 cash-flow supplemental as the reversal of year-to-date
 * (Q1+Q2+Q3) instead of the quarter's amount. Rebuild that quarter from the annual total.
 */
export function reconcileQuarterlyToAnnual<T extends { fiscalYear: string; period: string }>(
  quarters: T[],
  annuals: Array<{ fiscalYear: string } & Record<string, unknown>>,
  fields: string[],
): T[] {
  const annualByYear = new Map(annuals.map((row) => [String(row.fiscalYear), row]));
  return quarters.map((row) => {
    if (String(row.period).toUpperCase() !== "Q4") return row;
    const annual = annualByYear.get(String(row.fiscalYear));
    if (!annual) return row;
    const earlier = quarters.filter(
      (quarter) =>
        String(quarter.fiscalYear) === String(row.fiscalYear) && String(quarter.period).toUpperCase() !== "Q4",
    );
    if (earlier.length < 3) return row;
    const next = { ...row };
    for (const field of fields) {
      const q4 = Number((row as Record<string, unknown>)[field]);
      const parts = earlier.map((quarter) => Number((quarter as Record<string, unknown>)[field]));
      const fy = Number(annual[field]);
      if (!Number.isFinite(q4) || !Number.isFinite(fy) || parts.some((value) => !Number.isFinite(value))) continue;
      const ytd = parts.reduce((sum, value) => sum + value, 0);
      const implied = fy - ytd;
      const reversal = Math.abs(q4 + ytd) <= Math.max(1e6, Math.abs(ytd) * 0.02);
      if (reversal) (next as Record<string, unknown>)[field] = implied;
    }
    return next;
  });
}

/** Last four quarters versus the prior four, as a decimal change. */
export function ttmChange(rows: Array<Record<string, unknown>> | undefined, field: string) {
  if (!rows?.length) return null;
  return yearOverYear(trailingSum(rows, field, 0), trailingSum(rows, field, 4));
}

export function trailingSnapshot(rows: Array<Record<string, unknown>>, start = 0, count = 4) {
  const slice = rows.slice(start, start + count);
  if (slice.length < count) return null;
  const keys = new Set<string>();
  for (const row of slice) {
    for (const key of Object.keys(row)) keys.add(key);
  }
  const out: Record<string, unknown> = {};
  for (const key of keys) {
    let total = 0;
    let seen = 0;
    for (const row of slice) {
      const value = row[key];
      if (typeof value === "number" && Number.isFinite(value)) {
        total += value;
        seen += 1;
      }
    }
    if (seen === count) out[key] = total;
  }
  return out;
}

export function trailingDerivedMetric(
  rows: Array<Record<string, unknown>> | undefined,
  field: string,
  start = 0,
) {
  if (!rows?.length) return null;
  const snap = trailingSnapshot(rows, start);
  if (!snap) return null;
  const derived = derivedStatementMetrics(snap) as Record<string, number | null>;
  const value = derived[field];
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

export function canonicalSegmentName(name: string) {
  const cleaned = name.replace(/\s+segment$/i, "").trim();
  if (/^services?$/i.test(cleaned)) return "Services";
  return cleaned;
}

export function sumSegmentMaps(rows: Array<{ data?: Record<string, number> | null }>) {
  const out: Record<string, number> = {};
  for (const row of rows) {
    for (const [name, value] of Object.entries(row.data ?? {})) {
      if (typeof value !== "number" || !Number.isFinite(value)) continue;
      const key = canonicalSegmentName(name);
      out[key] = (out[key] ?? 0) + value;
    }
  }
  return out;
}

export function ttmSegmentMap(rows: FmpRevenueSegment[]) {
  if (rows.length < 4) return null;
  return sumSegmentMaps(rows.slice(0, 4));
}

/** Prior four quarters versus the current TTM window, for YoY segment growth. */
export function priorTtmSegmentMap(rows: FmpRevenueSegment[]) {
  if (rows.length < 8) return null;
  return sumSegmentMaps(rows.slice(4, 8));
}

export function segmentLevelValues(
  data: Record<string, number> | null | undefined,
  names: string[],
): Record<string, number | null> {
  const values: Record<string, number | null> = {};
  for (const name of names) {
    const value = data?.[name];
    values[name] = typeof value === "number" && Number.isFinite(value) ? value : null;
  }
  const namedTotal = names.reduce((sum, name) => sum + (values[name] ?? 0), 0);
  const allTotal = Object.values(data ?? {}).reduce(
    (sum, value) => sum + (typeof value === "number" && Number.isFinite(value) ? value : 0),
    0,
  );
  values.total = namedTotal || allTotal || null;
  return values;
}

export function withSegmentGrowth(
  values: Record<string, number | null>,
  prior: Record<string, number | null> | null | undefined,
  names: string[],
) {
  const next: Record<string, number | null> = { ...values };
  for (const name of [...names, "total"]) {
    next[`${name}Growth`] = yearOverYear(values[name], prior?.[name] ?? null);
  }
  return next;
}

export function topSegmentNames(
  rows: FmpRevenueSegment[],
  ttm?: Record<string, number> | null,
  limit = 8,
) {
  const source = ttm ?? sumSegmentMaps(rows.slice(0, 1));
  return Object.entries(source)
    .filter(([, value]) => typeof value === "number" && value > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([name]) => name);
}

const PRODUCT_SEGMENT_ORDER = ["iPhone", "Mac", "iPad", "Wearables, Home and Accessories"];
const GEO_SEGMENT_ORDER = ["Americas", "Europe", "Greater China", "Japan", "Rest of Asia Pacific"];

function orderedKnownNames(names: string[], preferred: string[]) {
  const remaining = new Set(names);
  const ordered: string[] = [];
  for (const want of preferred) {
    const match = names.find((name) => name.toLowerCase() === want.toLowerCase());
    if (!match || !remaining.has(match)) continue;
    ordered.push(match);
    remaining.delete(match);
  }
  for (const name of names) {
    if (remaining.has(name)) ordered.push(name);
  }
  return ordered;
}

/** SA metrics order: named products, then Services last. */
export function orderedProductNames(names: string[]) {
  const services = names.filter((name) => name === "Services");
  const rest = names.filter((name) => name !== "Services");
  return [...orderedKnownNames(rest, PRODUCT_SEGMENT_ORDER), ...services];
}

export function orderedGeoNames(names: string[]) {
  return orderedKnownNames(names, GEO_SEGMENT_ORDER);
}

export function hardwareProductTotal(levels: Record<string, number | null>, names: string[]) {
  const hardware = names.filter((name) => name !== "Services");
  let sum = 0;
  let any = false;
  for (const name of hardware) {
    const value = levels[name];
    if (value == null) continue;
    any = true;
    sum += value;
  }
  return any ? sum : null;
}

export function segmentStatementRows(
  names: string[],
  totalLabel = "Revenue (Total)",
  itemSuffix = "",
): StatementRow[] {
  const labelFor = (name: string) => (itemSuffix ? `${name} ${itemSuffix}` : name);
  return [
    ...names.flatMap((name) => [
      { key: name, label: labelFor(name), format: "money" as const },
      { key: `${name}Growth`, label: `${labelFor(name)} Growth`, format: "growth" as const },
    ]),
    { key: "total", label: totalLabel, emphasize: true, format: "money" as const },
    { key: "totalGrowth", label: `${totalLabel} Growth`, format: "growth" as const },
  ];
}

export function productMetricRows(names: string[]): StatementRow[] {
  const hardware = names.filter((name) => name !== "Services");
  const hasServices = names.includes("Services");
  return [
    ...hardware.flatMap((name) => [
      { key: name, label: `${name} Revenue`, format: "money" as const },
      { key: `${name}Growth`, label: `${name} Growth`, format: "growth" as const },
    ]),
    { key: "Products", label: "Products Revenue", emphasize: true, format: "money" as const },
    { key: "ProductsGrowth", label: "Products Growth", format: "growth" as const },
    ...(hasServices
      ? [
          { key: "Services", label: "Services Revenue", format: "money" as const },
          { key: "ServicesGrowth", label: "Services Growth", format: "growth" as const },
        ]
      : []),
    { key: "total", label: "Revenue (Total)", emphasize: true, format: "money" as const },
    { key: "totalGrowth", label: "Revenue (Total) Growth", format: "growth" as const },
  ];
}

export function segmentStatementColumns(
  rows: FmpRevenueSegment[],
  names: string[],
  period: "annual" | "quarter",
  ttm?: Record<string, number> | null,
  limit = 5,
  priorTtm?: Record<string, number> | null,
  ttmDate?: string | null,
  options?: { productRollup?: boolean },
) {
  const byKey = new Map<string, { label: string; date: string; data: Record<string, number> }>();
  for (const row of rows) {
    const year = String(row.fiscalYear);
    const key = period === "quarter" ? `${row.period}-${year}` : year;
    const label = period === "quarter" ? `${row.period} ${year}` : year;
    const existing = byKey.get(key)?.data ?? {};
    const data = { ...existing };
    for (const [name, value] of Object.entries(row.data ?? {})) {
      if (typeof value !== "number" || !Number.isFinite(value)) continue;
      const canonical = canonicalSegmentName(name);
      data[canonical] = (data[canonical] ?? 0) + value;
    }
    byKey.set(key, { label, date: row.date, data });
  }
  const ordered = [...byKey.entries()]
    .sort((a, b) => (b[1].date || "").localeCompare(a[1].date || ""))
    .slice(0, limit + 1);
  const enrich = (levels: Record<string, number | null>) =>
    options?.productRollup ? { ...levels, Products: hardwareProductTotal(levels, names) } : levels;
  const growthKeys = options?.productRollup ? [...names, "Products"] : names;
  const levelColumns = ordered.map(([key, row]) => ({
    key,
    label: row.label,
    date: row.date,
    levels: enrich(segmentLevelValues(row.data, names)),
  }));
  const displayed = levelColumns.slice(0, limit);
  const ttmLevels = ttm ? enrich(segmentLevelValues(ttm, names)) : null;
  const priorTtmLevels = priorTtm ? enrich(segmentLevelValues(priorTtm, names)) : (displayed[0]?.levels ?? null);

  return [
    ...(ttmLevels
      ? [
          {
            key: "ttm",
            label: "TTM",
            values: {
              ...(ttmDate ? { date: ttmDate } : {}),
              ...withSegmentGrowth(ttmLevels, priorTtmLevels, growthKeys),
            },
          },
        ]
      : []),
    ...displayed.map((column, index) => ({
      key: column.key,
      label: column.label,
      values: {
        date: column.date,
        fiscalYear: column.key,
        period: period === "annual" ? "FY" : column.key,
        ...withSegmentGrowth(column.levels, levelColumns[index + 1]?.levels ?? null, growthKeys),
      },
    })),
  ];
}

export function toStatementColumns(
  rows: Array<{ fiscalYear: string; period: string; date: string }>,
  period: "annual" | "quarter",
) {
  return rows.map((row) => ({
    key: `${row.fiscalYear}-${row.period}-${row.date}`,
    label: period === "quarter" ? `${row.period} ${row.fiscalYear}` : row.fiscalYear,
    values: row as unknown as Record<string, unknown>,
  }));
}

/** Copy `fooTTM` fields to `foo` so TTM ratio/metric rows share statement keys. */
export function stripTtmSuffix(row: Record<string, unknown> | null | undefined) {
  if (!row) return null;
  const values: Record<string, unknown> = { ...row };
  for (const [key, value] of Object.entries(row)) {
    if (key.endsWith("TTM")) values[key.slice(0, -3)] = value;
  }
  return values;
}

export function withTtmColumn(
  ttm: Record<string, unknown> | null | undefined,
  columns: ReturnType<typeof toStatementColumns>,
) {
  if (!ttm) return columns;
  return [{ key: "ttm", label: "TTM", values: ttm }, ...columns];
}

export function statementChartItems(
  columns: { label: string; values: Record<string, unknown> }[],
  key: string,
) {
  return [...columns]
    .filter((column) => column.label !== "TTM")
    .reverse()
    .filter((column) => typeof column.values[key] === "number" && Number.isFinite(column.values[key] as number))
    .map((column) => ({ label: column.label, value: column.values[key] as number }));
}

export type StatementSource = "standardized" | "reported";
export type StatementSpan = "5" | "10" | "max";
export type StatementView = "dollars" | "common-size";
export type StatementViewPeriod = "annual" | "quarter" | "trailing";

export function sourceFrom(value?: string): StatementSource {
  return value === "reported" || value === "as-reported" ? "reported" : "standardized";
}

export function spanFrom(value?: string): StatementSpan {
  if (value === "10" || value === "max") return value;
  return "5";
}

export function viewFrom(value?: string): StatementView {
  return value === "common-size" || value === "common" ? "common-size" : "dollars";
}

export function viewPeriodFrom(value?: string): StatementViewPeriod {
  if (value === "quarter") return "quarter";
  if (value === "trailing" || value === "ttm") return "trailing";
  return "annual";
}

export function statementLimit(period: "annual" | "quarter", span: StatementSpan) {
  if (period === "annual") return span === "max" ? 20 : span === "10" ? 10 : 5;
  return span === "5" ? 20 : 40;
}

export function statementHref(
  base: string,
  period: StatementViewPeriod,
  source: StatementSource = "standardized",
  span: StatementSpan = "5",
  view: StatementView = "dollars",
) {
  const params = new URLSearchParams();
  if (period === "quarter") params.set("period", "quarter");
  if (period === "trailing") params.set("period", "trailing");
  if (source === "reported") params.set("source", "reported");
  if (span !== "5") params.set("years", span);
  if (view === "common-size") params.set("view", "common-size");
  const query = params.toString();
  return query ? `${base}?${query}` : base;
}

export function statementToolbarHrefs(
  base: string,
  period: StatementViewPeriod,
  source: StatementSource,
  span: StatementSpan,
  view: StatementView = "dollars",
  options?: { trailing?: boolean },
) {
  const reportedPeriod: StatementViewPeriod = period === "trailing" ? "annual" : period;
  const showTrailing = options?.trailing !== false && source !== "reported";
  return {
    annualHref: statementHref(base, "annual", source, span, view),
    quarterHref: statementHref(base, "quarter", source, span, view),
    trailingHref: showTrailing ? statementHref(base, "trailing", source, span, view) : undefined,
    standardizedHref: statementHref(base, period, "standardized", span, view),
    reportedHref: statementHref(base, reportedPeriod, "reported", span, "dollars"),
    fiveHref: statementHref(base, period, source, "5", view),
    tenHref: statementHref(base, period, source, "10", view),
    maxHref: statementHref(base, period, source, "max", view),
    dollarsHref: statementHref(base, period, source, span, "dollars"),
    commonHref: statementHref(base, period, source, span, "common-size"),
  };
}

export function withRevenueBase(
  columns: { key: string; label: string; values: Record<string, unknown> }[],
  income: Array<{ fiscalYear: string; period: string; revenue?: number }>,
  ttmRevenue?: number | null,
) {
  const byPeriod = new Map(income.map((row) => [`${row.fiscalYear}-${row.period}`, row.revenue]));
  return columns.map((column) => {
    if (typeof column.values.revenue === "number") return column;
    const fy = column.values.fiscalYear;
    const period = column.values.period;
    const revenue =
      column.key === "ttm" || column.label === "TTM"
        ? ttmRevenue
        : typeof fy === "string" && typeof period === "string"
          ? byPeriod.get(`${fy}-${period}`)
          : undefined;
    return revenue == null ? column : { ...column, values: { ...column.values, revenue } };
  });
}

const XBRL_LABELS: Record<string, string> = {
  revenuefromcontractwithcustomerexcludingassessedtax: "Revenue from Contract with Customer, Excluding Assessed Tax",
  costofgoodsandservicessold: "Cost of Goods and Services Sold",
  grossprofit: "Gross Profit",
  researchanddevelopmentexpense: "Research and Development Expense",
  sellinggeneralandadministrativeexpense: "Selling, General and Administrative Expense",
  operatingexpenses: "Operating Expenses",
  operatingincomeloss: "Operating Income (Loss)",
  nonoperatingincomeexpense: "Nonoperating Income (Expense)",
  incomelossfromcontinuingoperationsbeforeincometaxesextraordinaryitemsnoncontrollinginterest:
    "Income (Loss) from Continuing Operations Before Tax",
  incometaxexpensebenefit: "Income Tax Expense (Benefit)",
  netincomeloss: "Net Income (Loss)",
  earningspersharebasic: "EPS (Basic)",
  earningspersharediluted: "EPS (Diluted)",
  weightedaveragenumberofsharesoutstandingbasic: "Shares Outstanding (Basic)",
  weightedaveragenumberofdilutedsharesoutstanding: "Shares Outstanding (Diluted)",
  othercomprehensiveincomelossforeigncurrencytransactionandtranslationadjustmentnetoftax:
    "OCI: Foreign Currency Translation, Net of Tax",
  othercomprehensiveincomelosscashflowhedgegainlossbeforereclassificationaftertax:
    "OCI: Cash Flow Hedge Gain (Loss) Before Reclassification",
  othercomprehensiveincomelosscashflowhedgegainlossreclassificationaftertax:
    "OCI: Cash Flow Hedge Reclassification",
  othercomprehensiveincomelosscashflowhedgegainlossafterreclassificationandtax:
    "OCI: Cash Flow Hedge After Reclassification",
  othercomprehensiveincomeunrealizedholdinggainlossonsecuritiesarisingduringperiodnetoftax:
    "OCI: Unrealized Holding Gain (Loss) on Securities",
  othercomprehensiveincomelossreclassificationadjustmentfromaociforsaleofsecuritiesnetoftax:
    "OCI: Reclassification from AOCI for Sale of Securities",
  othercomprehensiveincomelossavailableforsalesecuritiesadjustmentnetoftax:
    "OCI: Available-for-Sale Securities Adjustment",
  othercomprehensiveincomelossnetoftaxportionattributabletoparent: "Other Comprehensive Income, Net of Tax",
  comprehensiveincomenetoftax: "Comprehensive Income, Net of Tax",
  cashandcashequivalentsatcarryingvalue: "Cash and Cash Equivalents",
  marketablesecuritiescurrent: "Marketable Securities, Current",
  accountsreceivablenetcurrent: "Accounts Receivable, Net",
  nontradereceivablescurrent: "Non-Trade Receivables, Current",
  inventorynet: "Inventory, Net",
  otherassetscurrent: "Other Current Assets",
  assetscurrent: "Total Current Assets",
  marketablesecuritiesnoncurrent: "Marketable Securities, Noncurrent",
  propertyplantandequipmentnet: "Property, Plant and Equipment, Net",
  otherassetsnoncurrent: "Other Noncurrent Assets",
  assetsnoncurrent: "Total Noncurrent Assets",
  assets: "Total Assets",
  accountspayablecurrent: "Accounts Payable",
  otherliabilitiescurrent: "Other Current Liabilities",
  contractwithcustomerliabilitycurrent: "Contract Liability, Current",
  commercialpaper: "Commercial Paper",
  longtermdebtcurrent: "Long-Term Debt, Current",
  liabilitiescurrent: "Total Current Liabilities",
  longtermdebtnoncurrent: "Long-Term Debt, Noncurrent",
  otherliabilitiesnoncurrent: "Other Noncurrent Liabilities",
  liabilitiesnoncurrent: "Total Noncurrent Liabilities",
  liabilities: "Total Liabilities",
  commonstocksharesoutstanding: "Common Shares Outstanding",
  commonstocksharesissued: "Common Shares Issued",
  commonstocksincludingadditionalpaidincapital: "Common Stock and Additional Paid-in Capital",
  retainedearningsaccumulateddeficit: "Retained Earnings (Accumulated Deficit)",
  accumulatedothercomprehensiveincomelossnetoftax: "Accumulated Other Comprehensive Income (Loss)",
  stockholdersequity: "Shareholders' Equity",
  liabilitiesandstockholdersequity: "Total Liabilities and Equity",
  commonstockparorstatedvaluepershare: "Common Stock Par Value per Share",
  commonstocksharesauthorized: "Common Shares Authorized",
  cashcashequivalentsrestrictedcashandrestrictedcashequivalents: "Cash, Cash Equivalents and Restricted Cash",
  depreciationdepletionandamortization: "Depreciation, Depletion and Amortization",
  sharebasedcompensation: "Share-Based Compensation",
  othernoncashincomeexpense: "Other Noncash Income (Expense)",
  increasedecreaseinaccountsreceivable: "Change in Accounts Receivable",
  increasedecreaseinotherreceivables: "Change in Other Receivables",
  increasedecreaseininventories: "Change in Inventories",
  increasedecreaseinotheroperatingassets: "Change in Other Operating Assets",
  increasedecreaseinaccountspayable: "Change in Accounts Payable",
  increasedecreaseinotheroperatingliabilities: "Change in Other Operating Liabilities",
  netcashprovidedbyusedinoperatingactivities: "Net Cash from Operating Activities",
  paymentstoacquireavailableforsalesecuritiesdebt: "Purchases of Available-for-Sale Securities",
  proceedsfrommaturitiesprepaymentsandcallsofavailableforsalesecurities: "Maturities of Available-for-Sale Securities",
  proceedsfromsaleofavailableforsalesecuritiesdebt: "Sales of Available-for-Sale Securities",
  paymentstoacquirepropertyplantandequipment: "Purchases of Property, Plant and Equipment",
  paymentsforproceedsfromotherinvestingactivities: "Other Investing Activities",
  netcashprovidedbyusedininvestingactivities: "Net Cash from Investing Activities",
  paymentsrelatedtotaxwithholdingforsharebasedcompensation: "Tax Withholding for Share-Based Compensation",
  paymentsofdividends: "Dividends Paid",
  paymentsforrepurchaseofcommonstock: "Repurchases of Common Stock",
  proceedsfromissuanceoflongtermdebt: "Issuance of Long-Term Debt",
  repaymentsoflongtermdebt: "Repayments of Long-Term Debt",
  proceedsfromrepaymentsofcommercialpaper: "Net Commercial Paper Proceeds (Repayments)",
  proceedsfrompaymentsforotherfinancingactivities: "Other Financing Activities",
  netcashprovidedbyusedinfinancingactivities: "Net Cash from Financing Activities",
  cashcashequivalentsrestrictedcashandrestrictedcashequivalentsperiodincreasedecreaseincludingexchangerateeffect:
    "Net Change in Cash",
  incometaxespaidnet: "Income Taxes Paid, Net",
};

const XBRL_WORDS: { token: string; label: string }[] = [
  { token: "excludingassessedtax", label: "Excluding Assessed Tax" },
  { token: "fromcontractwithcustomer", label: "From Contract with Customer" },
  { token: "availableforsalesecurities", label: "Available-for-Sale Securities" },
  { token: "propertyplantandequipment", label: "Property, Plant and Equipment" },
  { token: "additionalpaidincapital", label: "Additional Paid-in Capital" },
  { token: "accumulateddeficit", label: "Accumulated Deficit" },
  { token: "sharebasedcompensation", label: "Share-Based Compensation" },
  { token: "othercomprehensiveincome", label: "Other Comprehensive Income" },
  { token: "weightedaveragenumberof", label: "Weighted Average Number of" },
  { token: "earningspershare", label: "Earnings per Share" },
  { token: "netcashprovidedbyusedin", label: "Net Cash from" },
  { token: "increasedecreasein", label: "Change in" },
  { token: "longtermdebt", label: "Long-Term Debt" },
  { token: "netoftax", label: "Net of Tax" },
  { token: "noncurrent", label: "Noncurrent" },
  { token: "current", label: "Current" },
  { token: "operating", label: "Operating" },
  { token: "investing", label: "Investing" },
  { token: "financing", label: "Financing" },
  { token: "activities", label: "Activities" },
  { token: "revenue", label: "Revenue" },
  { token: "income", label: "Income" },
  { token: "expense", label: "Expense" },
  { token: "loss", label: "Loss" },
  { token: "gain", label: "Gain" },
  { token: "assets", label: "Assets" },
  { token: "liabilities", label: "Liabilities" },
  { token: "equity", label: "Equity" },
  { token: "cash", label: "Cash" },
  { token: "debt", label: "Debt" },
  { token: "shares", label: "Shares" },
  { token: "stock", label: "Stock" },
  { token: "tax", label: "Tax" },
  { token: "net", label: "Net" },
  { token: "and", label: "and" },
  { token: "of", label: "of" },
  { token: "for", label: "for" },
  { token: "from", label: "from" },
  { token: "in", label: "in" },
].sort((a, b) => b.token.length - a.token.length);

export function humanizeXbrlKey(key: string) {
  const lower = key.toLowerCase().replace(/[^a-z0-9]/g, "");
  if (XBRL_LABELS[lower]) return XBRL_LABELS[lower];
  const parts: string[] = [];
  let rest = lower;
  while (rest) {
    const hit = XBRL_WORDS.find((word) => rest.startsWith(word.token));
    if (!hit) {
      parts.push(rest);
      break;
    }
    parts.push(hit.label);
    rest = rest.slice(hit.token.length);
  }
  const label = parts.join(" ").replace(/\s+/g, " ").trim();
  return label ? label[0].toUpperCase() + label.slice(1) : key;
}

function asReportedFormat(key: string): StatementRow["format"] {
  const lower = key.toLowerCase();
  if (
    lower.includes("pershare") ||
    lower.includes("earningspershare") ||
    lower.includes("parorstatedvalue")
  ) {
    return "eps";
  }
  if (
    lower.includes("sharesoutstanding") ||
    lower.includes("sharesissued") ||
    lower.includes("sharesauthorized") ||
    lower.includes("numberofshares") ||
    lower.includes("numberofdiluted")
  ) {
    return "share";
  }
  return "money";
}

function asReportedEmphasize(key: string) {
  return /^(grossprofit|operatingexpenses|operatingincomeloss|netincomeloss|comprehensiveincomenetoftax|assetscurrent|assetsnoncurrent|assets|liabilitiescurrent|liabilitiesnoncurrent|liabilities|stockholdersequity|liabilitiesandstockholdersequity|netcashprovidedbyusedinoperatingactivities|netcashprovidedbyusedininvestingactivities|netcashprovidedbyusedinfinancingactivities|cashcashequivalentsrestrictedcashandrestrictedcashequivalentsperiodincreasedecreaseincludingexchangerateeffect)$/i.test(
    key,
  );
}

function asReportedIndent(key: string) {
  const lower = key.toLowerCase();
  if (lower.startsWith("othercomprehensive") && !lower.includes("portionattributabletoparent")) return 1;
  if (lower.startsWith("increasedecreasein")) return 1;
  return 0;
}

export function asReportedColumns(
  rows: Array<{ fiscalYear: number | string; period: string; date: string; data?: Record<string, number | string | null> }>,
  period: "annual" | "quarter",
) {
  return rows.map((row) => ({
    key: `${row.fiscalYear}-${row.period}-${row.date}`,
    label: period === "quarter" ? `${row.period} ${row.fiscalYear}` : String(row.fiscalYear),
    values: { ...(row.data ?? {}), date: row.date } as Record<string, unknown>,
  }));
}

export function asReportedStatementRows(
  rows: Array<{ data?: Record<string, number | string | null> }>,
): StatementRow[] {
  const keys: string[] = [];
  const seen = new Set<string>();
  for (const row of rows) {
    for (const key of Object.keys(row.data ?? {})) {
      if (seen.has(key)) continue;
      seen.add(key);
      keys.push(key);
    }
  }
  return keys.map((key) => ({
    key,
    label: humanizeXbrlKey(key),
    format: asReportedFormat(key),
    emphasize: asReportedEmphasize(key),
    indent: asReportedIndent(key),
  }));
}
