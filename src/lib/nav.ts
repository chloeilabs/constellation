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
  { href: "/markets/commodities", label: "Commodities" },
  { href: "/markets/crypto", label: "Crypto" },
  { href: "/markets/forex", label: "Forex" },
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
  { href: "/stocks/industry", label: "Industries", match: "prefix" },
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
  { href: "/analysts", label: "Analysts" },
  { href: "/news/transcripts", label: "Transcripts" },
];

export const ETF_NAV: NavItem[] = [
  { href: "/etf", label: "Largest ETFs" },
  { href: "/list/vanguard-etfs", label: "Vanguard" },
  { href: "/list/ishares-etfs", label: "iShares" },
  { href: "/list/spdr-etfs", label: "SPDR" },
  { href: "/list/invesco-etfs", label: "Invesco" },
  { href: "/list/schwab-etfs", label: "Schwab" },
  { href: "/list/dividend-etfs", label: "Dividend ETFs" },
  { href: "/list/bond-etfs", label: "Bond ETFs" },
  { href: "/list/income-etfs", label: "Equity Income" },
  { href: "/list/crypto-etfs", label: "Crypto ETFs" },
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
  return [
    { href: `/stocks/${symbol}/news`, label: "All News", match: "exact" },
    { href: `/stocks/${symbol}/news/press-releases`, label: "Press Releases" },
    { href: `/stocks/${symbol}/transcripts`, label: "Transcripts" },
    { href: `/stocks/${symbol}/filings`, label: "SEC Filings" },
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

export function quoteFundamentalsNav(symbol: string) {
  return [
    { href: `/stocks/${symbol}/market-cap`, label: "Market Cap" },
    { href: `/stocks/${symbol}/shares`, label: "Shares" },
    { href: `/stocks/${symbol}/revenue`, label: "Revenue" },
    { href: `/stocks/${symbol}/gross-profit`, label: "Gross Profit" },
    { href: `/stocks/${symbol}/operating-income`, label: "Operating Income" },
    { href: `/stocks/${symbol}/ebitda`, label: "EBITDA" },
    { href: `/stocks/${symbol}/net-income`, label: "Net Income" },
    { href: `/stocks/${symbol}/earnings`, label: "EPS" },
    { href: `/stocks/${symbol}/free-cash-flow`, label: "FCF" },
    { href: `/stocks/${symbol}/capex`, label: "Capex" },
    { href: `/stocks/${symbol}/cash`, label: "Cash" },
    { href: `/stocks/${symbol}/assets`, label: "Assets" },
    { href: `/stocks/${symbol}/liabilities`, label: "Liabilities" },
    { href: `/stocks/${symbol}/debt`, label: "Debt" },
    { href: `/stocks/${symbol}/equity`, label: "Equity" },
    { href: `/stocks/${symbol}/pe-ratio`, label: "PE Ratio" },
    { href: `/stocks/${symbol}/ps-ratio`, label: "PS Ratio" },
    { href: `/stocks/${symbol}/pb-ratio`, label: "PB Ratio" },
    { href: `/stocks/${symbol}/current-ratio`, label: "Current Ratio" },
    { href: `/stocks/${symbol}/roe`, label: "ROE" },
    { href: `/stocks/${symbol}/roa`, label: "ROA" },
    { href: `/stocks/${symbol}/roic`, label: "ROIC" },
    { href: `/stocks/${symbol}/enterprise-value`, label: "EV" },
    { href: `/stocks/${symbol}/owner-earnings`, label: "Owner Earnings" },
    { href: `/stocks/${symbol}/employees`, label: "Employees" },
    { href: `/stocks/${symbol}/ownership`, label: "Ownership" },
  ];
}
