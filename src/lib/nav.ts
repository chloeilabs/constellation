import { isIndexTicker } from "@/lib/indexes";
import { decodeTicker, stockPath } from "@/lib/listings";

export type NavItem = { href: string; label: string; match?: "exact" | "prefix" };

export function extendedHoursNav(base: "/markets/premarket" | "/markets/afterhours"): NavItem[] {
  return [
    { href: base, label: "Overview", match: "exact" },
    { href: `${base}/gainers`, label: "Gainers" },
    { href: `${base}/losers`, label: "Losers" },
    { href: `${base}/active`, label: "Most Active" },
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
  { href: "/etf", label: "Largest ETFs" },
  { href: "/etf/lookup", label: "Reverse Lookup" },
  { href: "/etf/compare", label: "Compare ETFs" },
  { href: "/screener?type=etf", label: "ETF Screener" },
  { href: "/list/vanguard-etfs", label: "Vanguard" },
  { href: "/list/ishares-etfs", label: "iShares" },
  { href: "/list/spdr-etfs", label: "SPDR" },
  { href: "/list/invesco-etfs", label: "Invesco" },
  { href: "/list/schwab-etfs", label: "Schwab" },
  { href: "/list/dividend-etfs", label: "Dividend ETFs" },
  { href: "/list/bond-etfs", label: "Bond ETFs" },
  { href: "/list/income-etfs", label: "Equity Income" },
  { href: "/list/crypto-etfs", label: "Crypto ETFs" },
  { href: "/list/bitcoin-etfs", label: "Bitcoin ETFs" },
  { href: "/list/ethereum-etfs", label: "Ethereum ETFs" },
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
    { href: `/funds/${ticker}/news`, label: "News" },
  ];
}

export function quoteFundamentalsNav(symbol: string) {
  const base = stockPath(symbol);
  return [
    { href: `${base}/market-cap`, label: "Market Cap" },
    { href: `${base}/shares`, label: "Shares" },
    { href: `${base}/buybacks`, label: "Buybacks" },
    { href: `${base}/revenue`, label: "Revenue" },
    { href: `${base}/gross-profit`, label: "Gross Profit" },
    { href: `${base}/gross-margin`, label: "Gross Margin" },
    { href: `${base}/operating-income`, label: "Operating Income" },
    { href: `${base}/operating-margin`, label: "Operating Margin" },
    { href: `${base}/ebitda`, label: "EBITDA" },
    { href: `${base}/ebitda-margin`, label: "EBITDA Margin" },
    { href: `${base}/net-income`, label: "Net Income" },
    { href: `${base}/profit-margin`, label: "Profit Margin" },
    { href: `${base}/earnings`, label: "EPS" },
    { href: `${base}/free-cash-flow`, label: "FCF" },
    { href: `${base}/fcf-yield`, label: "FCF Yield" },
    { href: `${base}/fcf-margin`, label: "FCF Margin" },
    { href: `${base}/capex`, label: "Capex" },
    { href: `${base}/cash`, label: "Cash" },
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
    { href: `${base}/ev-ebitda`, label: "EV / EBITDA" },
    { href: `${base}/ev-sales`, label: "EV / Sales" },
    { href: `${base}/dividend-yield`, label: "Dividend Yield" },
    { href: `${base}/payout-ratio`, label: "Payout" },
    { href: `${base}/current-ratio`, label: "Current Ratio" },
    { href: `${base}/quick-ratio`, label: "Quick Ratio" },
    { href: `${base}/debt-equity-ratio`, label: "Debt / Equity" },
    { href: `${base}/roe`, label: "ROE" },
    { href: `${base}/roa`, label: "ROA" },
    { href: `${base}/roic`, label: "ROIC" },
    { href: `${base}/roce`, label: "ROCE" },
    { href: `${base}/enterprise-value`, label: "EV" },
    { href: `${base}/owner-earnings`, label: "Owner Earnings" },
    { href: `${base}/fair-value`, label: "Fair Value" },
    { href: `${base}/employees`, label: "Employees" },
    { href: `${base}/splits`, label: "Splits" },
    { href: `${base}/peers`, label: "Peers" },
    { href: `${base}/ownership`, label: "Ownership" },
  ];
}
