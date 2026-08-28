import type { ChartPoint } from "@/lib/types";

export type FundamentalSource = "income" | "cash" | "balance" | "ratios" | "metrics";
export type FundamentalFormat = "money" | "eps" | "percent" | "ratio" | "share";

export type FundamentalMetric = {
  id: string;
  label: string;
  group: string;
  source: FundamentalSource;
  field: string;
  format: FundamentalFormat;
};

export const FUNDAMENTAL_METRICS: FundamentalMetric[] = [
  { id: "revenue", label: "Revenue", group: "Income", source: "income", field: "revenue", format: "money" },
  { id: "grossProfit", label: "Gross Profit", group: "Income", source: "income", field: "grossProfit", format: "money" },
  { id: "operatingIncome", label: "Operating Income", group: "Income", source: "income", field: "operatingIncome", format: "money" },
  { id: "netIncome", label: "Net Income", group: "Income", source: "income", field: "netIncome", format: "money" },
  { id: "eps", label: "EPS (Diluted)", group: "Income", source: "income", field: "epsDiluted", format: "eps" },
  { id: "ebitda", label: "EBITDA", group: "Income", source: "income", field: "ebitda", format: "money" },
  { id: "ebit", label: "EBIT", group: "Income", source: "income", field: "ebit", format: "money" },
  { id: "operatingMargin", label: "Operating Margin", group: "Income", source: "income", field: "operatingProfitMargin", format: "percent" },
  { id: "rd", label: "R&D", group: "Income", source: "income", field: "researchAndDevelopmentExpenses", format: "money" },
  { id: "sga", label: "SG&A", group: "Income", source: "income", field: "sellingGeneralAndAdministrativeExpenses", format: "money" },
  { id: "opex", label: "Operating Expenses", group: "Income", source: "income", field: "operatingExpenses", format: "money" },
  { id: "shares", label: "Shares (Diluted)", group: "Income", source: "income", field: "weightedAverageShsOutDil", format: "share" },
  { id: "operatingCashFlow", label: "Operating Cash Flow", group: "Cash Flow", source: "cash", field: "netCashProvidedByOperatingActivities", format: "money" },
  { id: "freeCashFlow", label: "Free Cash Flow", group: "Cash Flow", source: "cash", field: "freeCashFlow", format: "money" },
  { id: "capex", label: "Capital Expenditures", group: "Cash Flow", source: "cash", field: "investmentsInPropertyPlantAndEquipment", format: "money" },
  { id: "buybacks", label: "Share Repurchases", group: "Cash Flow", source: "cash", field: "commonStockRepurchased", format: "money" },
  { id: "cash", label: "Cash & Equivalents", group: "Balance Sheet", source: "balance", field: "cashAndCashEquivalents", format: "money" },
  { id: "assets", label: "Total Assets", group: "Balance Sheet", source: "balance", field: "totalAssets", format: "money" },
  { id: "debt", label: "Total Debt", group: "Balance Sheet", source: "balance", field: "totalDebt", format: "money" },
  { id: "equity", label: "Shareholders' Equity", group: "Balance Sheet", source: "balance", field: "totalStockholdersEquity", format: "money" },
  { id: "workingCapital", label: "Working Capital", group: "Balance Sheet", source: "balance", field: "workingCapital", format: "money" },
  { id: "pe", label: "PE Ratio", group: "Valuation", source: "ratios", field: "priceToEarningsRatio", format: "ratio" },
  { id: "ps", label: "PS Ratio", group: "Valuation", source: "ratios", field: "priceToSalesRatio", format: "ratio" },
  { id: "pb", label: "PB Ratio", group: "Valuation", source: "ratios", field: "priceToBookRatio", format: "ratio" },
  { id: "pfcf", label: "P/FCF", group: "Valuation", source: "ratios", field: "priceToFreeCashFlowRatio", format: "ratio" },
  { id: "peg", label: "PEG Ratio", group: "Valuation", source: "ratios", field: "priceToEarningsGrowthRatio", format: "ratio" },
  { id: "currentRatio", label: "Current Ratio", group: "Valuation", source: "ratios", field: "currentRatio", format: "ratio" },
  { id: "quickRatio", label: "Quick Ratio", group: "Valuation", source: "ratios", field: "quickRatio", format: "ratio" },
  { id: "debtEquity", label: "Debt / Equity", group: "Valuation", source: "ratios", field: "debtToEquityRatio", format: "ratio" },
  { id: "roe", label: "ROE", group: "Returns", source: "metrics", field: "returnOnEquity", format: "percent" },
  { id: "roa", label: "ROA", group: "Returns", source: "metrics", field: "returnOnAssets", format: "percent" },
  { id: "roic", label: "ROIC", group: "Returns", source: "metrics", field: "returnOnInvestedCapital", format: "percent" },
  { id: "roce", label: "ROCE", group: "Returns", source: "metrics", field: "returnOnCapitalEmployed", format: "percent" },
  { id: "evEbitda", label: "EV / EBITDA", group: "Returns", source: "metrics", field: "evToEBITDA", format: "ratio" },
  { id: "evSales", label: "EV / Sales", group: "Returns", source: "metrics", field: "evToSales", format: "ratio" },
  { id: "fcfYield", label: "FCF Yield", group: "Returns", source: "metrics", field: "freeCashFlowYield", format: "percent" },
  { id: "assetTurnover", label: "Asset Turnover", group: "Returns", source: "metrics", field: "assetTurnover", format: "ratio" },
  { id: "inventoryTurnover", label: "Inventory Turnover", group: "Returns", source: "metrics", field: "inventoryTurnover", format: "ratio" },
  { id: "book", label: "Book Value / Share", group: "Returns", source: "metrics", field: "bookValuePerShare", format: "eps" },
];

export function resolveFundamentalMetric(id?: string | null) {
  return FUNDAMENTAL_METRICS.find((metric) => metric.id === id) ?? FUNDAMENTAL_METRICS[0];
}

export function fundamentalMetricGroups() {
  const groups: { title: string; metrics: FundamentalMetric[] }[] = [];
  for (const metric of FUNDAMENTAL_METRICS) {
    const last = groups.at(-1);
    if (last && last.title === metric.group) last.metrics.push(metric);
    else groups.push({ title: metric.group, metrics: [metric] });
  }
  return groups;
}

export function toCloseSeries(rows: { date: string; price: number }[]): ChartPoint[] {
  return [...rows]
    .filter((row) => typeof row.price === "number" && row.price > 0)
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((row) => ({ time: row.date, value: row.price }));
}

export function closeOnOrBefore(candles: ChartPoint[], date?: string | null) {
  if (!date) return null;
  const day = date.slice(0, 10);
  let best: number | null = null;
  for (const row of candles) {
    const stamp = row.time.slice(0, 10);
    if (stamp <= day && Number.isFinite(row.value)) best = row.value;
    if (stamp > day) break;
  }
  return best;
}
