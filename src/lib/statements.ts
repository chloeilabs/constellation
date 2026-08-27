export type StatementRow = {
  key: string;
  label: string;
  indent?: number;
  emphasize?: boolean;
  format?: "money" | "share" | "eps" | "ratio" | "percent" | "number";
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
  { key: "interestIncome", label: "Interest Income", indent: 1, format: "money" },
  { key: "interestExpense", label: "Interest Expense", indent: 1, format: "money" },
  { key: "totalOtherIncomeExpensesNet", label: "Other Income / Expense", format: "money" },
  { key: "incomeBeforeTax", label: "Pretax Income", emphasize: true, format: "money" },
  { key: "incomeTaxExpense", label: "Income Tax", format: "money" },
  { key: "netIncome", label: "Net Income", emphasize: true, format: "money" },
  { key: "epsDiluted", label: "EPS (Diluted)", format: "eps" },
  { key: "weightedAverageShsOutDil", label: "Shares Outstanding (Diluted)", format: "share" },
  { key: "ebitda", label: "EBITDA", format: "money" },
];

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

export const RATIO_ROWS: StatementRow[] = [
  { key: "grossProfitMargin", label: "Gross Margin", format: "percent" },
  { key: "operatingProfitMargin", label: "Operating Margin", format: "percent" },
  { key: "netProfitMargin", label: "Profit Margin", format: "percent" },
  { key: "ebitdaMargin", label: "EBITDA Margin", format: "percent" },
  { key: "returnOnAssets", label: "Return on Assets", format: "percent" },
  { key: "returnOnEquity", label: "Return on Equity", format: "percent" },
  { key: "currentRatio", label: "Current Ratio", format: "ratio" },
  { key: "quickRatio", label: "Quick Ratio", format: "ratio" },
  { key: "debtToEquityRatio", label: "Debt / Equity", format: "ratio" },
  { key: "priceToEarningsRatio", label: "PE Ratio", format: "ratio" },
  { key: "priceToBookRatio", label: "PB Ratio", format: "ratio" },
  { key: "priceToSalesRatio", label: "PS Ratio", format: "ratio" },
  { key: "priceToFreeCashFlowRatio", label: "P/FCF", format: "ratio" },
  { key: "dividendYield", label: "Dividend Yield", format: "percent" },
  { key: "dividendPayoutRatio", label: "Payout Ratio", format: "percent" },
];

export const INDEX_LABELS: Record<string, string> = {
  "^GSPC": "S&P 500",
  "^DJI": "Dow Jones",
  "^IXIC": "Nasdaq",
  "^RUT": "Russell 2000",
  "^VIX": "VIX",
};

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
