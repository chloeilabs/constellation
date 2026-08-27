import { yearOverYear } from "@/lib/format";
import type { FmpRevenueSegment } from "@/lib/types";

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

/** Last four quarters versus the prior four, as a decimal change. */
export function ttmChange(rows: Array<Record<string, unknown>> | undefined, field: string) {
  if (!rows?.length) return null;
  return yearOverYear(trailingSum(rows, field, 0), trailingSum(rows, field, 4));
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

export function statementLimit(period: "annual" | "quarter", span: StatementSpan) {
  if (period === "annual") return span === "max" ? 20 : span === "10" ? 10 : 5;
  return span === "5" ? 20 : 40;
}

export function statementHref(
  base: string,
  period: "annual" | "quarter",
  source: StatementSource = "standardized",
  span: StatementSpan = "5",
  view: StatementView = "dollars",
) {
  const params = new URLSearchParams();
  if (period === "quarter") params.set("period", "quarter");
  if (source === "reported") params.set("source", "reported");
  if (span !== "5") params.set("years", span);
  if (view === "common-size") params.set("view", "common-size");
  const query = params.toString();
  return query ? `${base}?${query}` : base;
}

export function statementToolbarHrefs(
  base: string,
  period: "annual" | "quarter",
  source: StatementSource,
  span: StatementSpan,
  view: StatementView = "dollars",
) {
  return {
    annualHref: statementHref(base, "annual", source, span, view),
    quarterHref: statementHref(base, "quarter", source, span, view),
    standardizedHref: statementHref(base, period, "standardized", span, view),
    reportedHref: statementHref(base, period, "reported", span, "dollars"),
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
    values: (row.data ?? {}) as Record<string, unknown>,
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
