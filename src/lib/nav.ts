import { isIndexTicker } from "@/lib/indexes";
import { decodeTicker, stockPath } from "@/lib/listings";
import { vehiclePath, type VehicleKind } from "@/lib/vehicle";

export type NavItem = { href: string; label: string; match?: "exact" | "prefix" };

export function extendedHoursNav(base: "/markets/premarket" | "/markets/afterhours"): NavItem[] {
  return [
    { href: base, label: "Overview", match: "exact" },
    { href: `${base}/gainers`, label: "Gainers" },
    { href: `${base}/losers`, label: "Losers" },
    { href: `${base}/active`, label: "Most Active" },
  ];
}

export function marketAssetNewsNav(kind: "crypto" | "forex", symbol: string): NavItem[] {
  const base = kind === "crypto" ? `/markets/crypto/${symbol}` : `/markets/forex/${symbol}`;
  return [
    { href: base, label: "Overview", match: "exact" },
    { href: `${base}/news`, label: "News" },
  ];
}

export const MARKET_NAV: NavItem[] = [
  { href: "/markets", label: "Overview" },
  { href: "/markets/global", label: "World Markets" },
  { href: "/markets/hours", label: "Hours" },
  { href: "/markets/indexes", label: "Indexes" },
  { href: "/markets/heatmap", label: "Heatmap" },
  { href: "/markets/premarket", label: "Pre-Market", match: "prefix" },
  { href: "/markets/afterhours", label: "After Hours", match: "prefix" },
  { href: "/markets/index-changes", label: "Index Changes" },
  { href: "/markets/gainers", label: "Gainers" },
  { href: "/markets/losers", label: "Losers" },
  { href: "/markets/active", label: "Most Active" },
  { href: "/markets/sectors", label: "Sectors" },
  { href: "/markets/industries", label: "Industries" },
  { href: "/markets/treasury", label: "Treasury" },
  { href: "/markets/commodities", label: "Commodities", match: "prefix" },
  { href: "/markets/crypto", label: "Crypto", match: "prefix" },
  { href: "/markets/forex", label: "Forex", match: "prefix" },
];

export const INDEX_CHANGES_NAV: NavItem[] = [
  { href: "/markets/index-changes", label: "S&P 500" },
  { href: "/markets/index-changes?index=nasdaq", label: "Nasdaq 100" },
  { href: "/markets/index-changes?index=dow", label: "Dow Jones" },
];

export const CALENDAR_NAV: NavItem[] = [
  { href: "/calendar/earnings", label: "Earnings" },
  { href: "/calendar/ipos", label: "IPOs" },
  { href: "/calendar/dividends", label: "Dividends" },
  { href: "/calendar/splits", label: "Splits" },
  { href: "/calendar/economy", label: "Economy" },
  { href: "/actions", label: "Actions" },
];

export const IPO_NAV: NavItem[] = [
  { href: "/ipos", label: "Recent IPOs" },
  { href: "/calendar/ipos", label: "IPO Calendar" },
];

export const STOCKS_NAV: NavItem[] = [
  { href: "/stocks", label: "All Stocks" },
  { href: "/stocks/sector", label: "Sectors", match: "prefix" },
  { href: "/stocks/industry", label: "Industries", match: "prefix" },
  { href: "/stocks/country", label: "Countries", match: "prefix" },
  { href: "/list/exchanges", label: "Exchanges" },
  { href: "/list/sp-500-stocks", label: "S&P 500" },
  { href: "/list/nasdaq-100-stocks", label: "Nasdaq 100" },
  { href: "/list/dow-jones-stocks", label: "Dow Jones" },
  { href: "/list/biggest-companies", label: "Biggest Companies" },
  { href: "/list", label: "All Lists" },
  { href: "/etf", label: "ETFs" },
];

export const HEATMAP_INDEX_NAV: NavItem[] = [
  { href: "/markets/heatmap", label: "S&P 500" },
  { href: "/markets/heatmap?index=nasdaq", label: "Nasdaq 100" },
  { href: "/markets/heatmap?index=dow", label: "Dow Jones" },
];

export const NEWS_NAV: NavItem[] = [
  { href: "/news", label: "Stocks" },
  { href: "/news/press-releases", label: "Press Releases" },
  { href: "/news/general", label: "General" },
  { href: "/news/filings", label: "Filings" },
  { href: "/news/crypto", label: "Crypto" },
  { href: "/news/forex", label: "Forex" },
  { href: "/analysts", label: "Analysts" },
  { href: "/news/transcripts", label: "Transcripts" },
];

export const ETF_NAV: NavItem[] = [
  { href: "/etf", label: "All ETFs" },
  { href: "/etf/lookup", label: "Reverse Lookup" },
  { href: "/etf/compare", label: "Compare ETFs" },
  { href: "/screener?type=etf", label: "ETF Screener" },
  { href: "/list/vanguard-etfs", label: "Vanguard" },
  { href: "/list/ishares-etfs", label: "iShares" },
  { href: "/list/spdr-etfs", label: "SPDR" },
  { href: "/list/invesco-etfs", label: "Invesco" },
  { href: "/list/schwab-etfs", label: "Schwab" },
  { href: "/list/dividend-etfs", label: "Dividend ETFs" },
  { href: "/list/monthly-dividend-etfs", label: "Monthly ETFs" },
  { href: "/list/weekly-dividend-etfs", label: "Weekly ETFs" },
  { href: "/list/bond-etfs", label: "Bond ETFs" },
  { href: "/list/income-etfs", label: "Equity Income" },
  { href: "/list/covered-call-etfs", label: "Covered Call" },
  { href: "/list/exchange-traded-notes", label: "ETNs" },
  { href: "/list/crypto-etfs", label: "Crypto ETFs" },
  { href: "/list/bitcoin-etfs", label: "Bitcoin ETFs" },
  { href: "/list/ethereum-etfs", label: "Ethereum ETFs" },
  { href: "/list/solana-etfs", label: "Solana ETFs" },
  { href: "/list/xrp-etfs", label: "XRP ETFs" },
  { href: "/list/artificial-intelligence-etfs", label: "AI ETFs" },
  { href: "/list/australian-etfs", label: "Australian ETFs" },
  { href: "/list/canadian-etfs", label: "Canadian ETFs" },
  { href: "/list/commodity-etfs", label: "Commodity ETFs" },
  { href: "/list/leveraged-etfs", label: "Leveraged" },
  { href: "/list/sector-etfs", label: "Sector ETFs" },
  { href: "/funds", label: "Mutual Funds" },
];

export const CONGRESS_NAV: NavItem[] = [
  { href: "/insider-trading", label: "Insiders" },
  { href: "/congress", label: "Congress" },
  { href: "/congress/senate", label: "Senate" },
  { href: "/congress/house", label: "House" },
  { href: "/institutional", label: "13F Filings" },
];

export function quoteNewsNav(symbol: string): NavItem[] {
  const ticker = decodeTicker(symbol);
  if (isIndexTicker(ticker)) {
    return [{ href: stockPath(ticker, "/news"), label: "News", match: "exact" }];
  }
  return [
    { href: stockPath(ticker, "/news"), label: "All News", match: "exact" },
    { href: stockPath(ticker, "/news/press-releases"), label: "Press Releases" },
    { href: stockPath(ticker, "/transcripts"), label: "Transcripts" },
    { href: stockPath(ticker, "/filings"), label: "SEC Filings" },
  ];
}

export function etfQuoteNav(symbol: string): NavItem[] {
  return [
    { href: `/etf/${symbol}`, label: "Overview", match: "exact" },
    { href: `/etf/${symbol}/holdings`, label: "Holdings" },
    { href: `/etf/${symbol}/dividend`, label: "Dividend" },
    { href: `/etf/${symbol}/chart`, label: "Chart" },
    { href: `/etf/${symbol}/history`, label: "History" },
    { href: `/etf/${symbol}/news`, label: "News" },
  ];
}

export function fundQuoteNav(symbol: string): NavItem[] {
  const ticker = decodeTicker(symbol);
  return [
    { href: `/funds/${ticker}`, label: "Overview", match: "exact" },
    { href: `/funds/${ticker}/holdings`, label: "Holdings" },
    { href: `/funds/${ticker}/dividend`, label: "Dividend" },
    { href: `/funds/${ticker}/chart`, label: "Chart" },
    { href: `/funds/${ticker}/history`, label: "History" },
    { href: `/funds/${ticker}/news`, label: "News" },
  ];
}

export function vehicleNewsNav(kind: VehicleKind, symbol: string): NavItem[] {
  const ticker = decodeTicker(symbol);
  return [
    { href: vehiclePath(kind, ticker, "/news"), label: "All News", match: "exact" },
    { href: vehiclePath(kind, ticker, "/news/press-releases"), label: "Press Releases" },
  ];
}

export function companyNav(symbol: string): NavItem[] {
  const ticker = decodeTicker(symbol);
  return [
    { href: stockPath(ticker, "/company"), label: "Profile" },
    { href: stockPath(ticker, "/company/executives"), label: "Executives" },
    { href: stockPath(ticker, "/esg"), label: "ESG" },
  ];
}

export function metricsNav(symbol: string): NavItem[] {
  const ticker = decodeTicker(symbol);
  return [
    { href: stockPath(ticker, "/metrics"), label: "Overview", match: "exact" },
    { href: stockPath(ticker, "/metrics/revenue-by-segment"), label: "Revenue by Segment" },
    { href: stockPath(ticker, "/metrics/revenue-by-geography"), label: "Revenue by Geography" },
    { href: stockPath(ticker, "/metrics/operating-expense-breakdown"), label: "Operating Expenses" },
  ];
}

export function quoteRelatedNav(symbol: string): NavItem[] {
  const ticker = decodeTicker(symbol);
  const base = stockPath(ticker);
  return [
    { href: `${base}/pe-ratio`, label: "PE Ratio" },
    { href: `${base}/market-cap`, label: "Market Cap" },
    { href: `${base}/revenue`, label: "Revenue" },
    { href: `${base}/fair-value`, label: "Fair Value" },
    { href: `${base}/peers`, label: "Peers" },
  ];
}

export function quoteFundamentalsNav(symbol: string) {
  const base = stockPath(symbol);
  return [
    { href: `${base}/fundamental-chart`, label: "Fund. Chart" },
    { href: `${base}/market-cap`, label: "Market Cap" },
    { href: `${base}/shares`, label: "Shares" },
    { href: `${base}/buybacks`, label: "Buybacks" },
    { href: `${base}/revenue`, label: "Revenue" },
    { href: `${base}/cost-of-revenue`, label: "Cost of Revenue" },
    { href: `${base}/gross-profit`, label: "Gross Profit" },
    { href: `${base}/gross-margin`, label: "Gross Margin" },
    { href: `${base}/operating-income`, label: "Operating Income" },
    { href: `${base}/operating-margin`, label: "Operating Margin" },
    { href: `${base}/research-and-development`, label: "R&D" },
    { href: `${base}/sga`, label: "SG&A" },
    { href: `${base}/operating-expenses`, label: "Operating Expenses" },
    { href: `${base}/ebitda`, label: "EBITDA" },
    { href: `${base}/ebitda-margin`, label: "EBITDA Margin" },
    { href: `${base}/ebit`, label: "EBIT" },
    { href: `${base}/pretax-income`, label: "Pretax Income" },
    { href: `${base}/net-income`, label: "Net Income" },
    { href: `${base}/profit-margin`, label: "Profit Margin" },
    { href: `${base}/income-tax`, label: "Income Tax" },
    { href: `${base}/interest-income`, label: "Interest Income" },
    { href: `${base}/interest-expense`, label: "Interest Expense" },
    { href: `${base}/earnings`, label: "EPS" },
    { href: `${base}/free-cash-flow`, label: "FCF" },
    { href: `${base}/operating-cash-flow`, label: "Operating CF" },
    { href: `${base}/fcf-yield`, label: "FCF Yield" },
    { href: `${base}/fcf-margin`, label: "FCF Margin" },
    { href: `${base}/capex`, label: "Capex" },
    { href: `${base}/depreciation-amortization`, label: "D&A" },
    { href: `${base}/net-borrowing`, label: "Net Borrowing" },
    { href: `${base}/cash`, label: "Cash" },
    { href: `${base}/net-cash`, label: "Net Cash" },
    { href: `${base}/net-cash-per-share`, label: "Net Cash / Share" },
    { href: `${base}/working-capital`, label: "Working Capital" },
    { href: `${base}/book-value`, label: "Book Value / Share" },
    { href: `${base}/tangible-book-value`, label: "Tangible Book" },
    { href: `${base}/assets`, label: "Assets" },
    { href: `${base}/liabilities`, label: "Liabilities" },
    { href: `${base}/debt`, label: "Debt" },
    { href: `${base}/equity`, label: "Equity" },
    { href: `${base}/pe-ratio`, label: "PE Ratio" },
    { href: `${base}/forward-pe`, label: "Forward PE" },
    { href: `${base}/earnings-yield`, label: "Earnings Yield" },
    { href: `${base}/peg-ratio`, label: "PEG Ratio" },
    { href: `${base}/ps-ratio`, label: "PS Ratio" },
    { href: `${base}/forward-ps`, label: "Forward PS" },
    { href: `${base}/pb-ratio`, label: "PB Ratio" },
    { href: `${base}/pfcf-ratio`, label: "P/FCF" },
    { href: `${base}/pocf-ratio`, label: "P/OCF" },
    { href: `${base}/ev-ebitda`, label: "EV / EBITDA" },
    { href: `${base}/ev-ebit`, label: "EV / EBIT" },
    { href: `${base}/ev-earnings`, label: "EV / Earnings" },
    { href: `${base}/ev-fcf`, label: "EV / FCF" },
    { href: `${base}/ev-sales`, label: "EV / Sales" },
    { href: `${base}/debt-fcf`, label: "Debt / FCF" },
    { href: `${base}/debt-ebitda`, label: "Debt / EBITDA" },
    { href: `${base}/dividend-yield`, label: "Dividend Yield" },
    { href: `${base}/payout-ratio`, label: "Payout" },
    { href: `${base}/current-ratio`, label: "Current Ratio" },
    { href: `${base}/quick-ratio`, label: "Quick Ratio" },
    { href: `${base}/cash-ratio`, label: "Cash Ratio" },
    { href: `${base}/debt-equity-ratio`, label: "Debt / Equity" },
    { href: `${base}/net-debt-ebitda`, label: "Net Debt / EBITDA" },
    { href: `${base}/interest-coverage`, label: "Interest Coverage" },
    { href: `${base}/roe`, label: "ROE" },
    { href: `${base}/roa`, label: "ROA" },
    { href: `${base}/roic`, label: "ROIC" },
    { href: `${base}/roce`, label: "ROCE" },
    { href: `${base}/asset-turnover`, label: "Asset Turnover" },
    { href: `${base}/inventory-turnover`, label: "Inventory Turnover" },
    { href: `${base}/days-sales-outstanding`, label: "DSO" },
    { href: `${base}/days-inventory-outstanding`, label: "DIO" },
    { href: `${base}/days-payables-outstanding`, label: "DPO" },
    { href: `${base}/cash-conversion-cycle`, label: "CCC" },
    { href: `${base}/effective-tax-rate`, label: "Tax Rate" },
    { href: `${base}/enterprise-value`, label: "EV" },
    { href: `${base}/owner-earnings`, label: "Owner Earnings" },
    { href: `${base}/fair-value`, label: "Fair Value" },
    { href: `${base}/graham-number`, label: "Graham Number" },
    { href: `${base}/altman-z-score`, label: "Altman Z" },
    { href: `${base}/piotroski-score`, label: "Piotroski" },
    { href: `${base}/wacc`, label: "WACC" },
    { href: `${base}/employees`, label: "Employees" },
    { href: `${base}/splits`, label: "Splits" },
    { href: `${base}/peers`, label: "Peers" },
    { href: `${base}/ownership`, label: "Ownership" },
  ];
}
