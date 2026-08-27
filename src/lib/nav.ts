export type NavItem = { href: string; label: string; match?: "exact" | "prefix" };

export const MARKET_NAV: NavItem[] = [
  { href: "/markets", label: "Overview" },
  { href: "/markets/heatmap", label: "Heatmap" },
  { href: "/markets/gainers", label: "Gainers" },
  { href: "/markets/losers", label: "Losers" },
  { href: "/markets/active", label: "Most Active" },
  { href: "/markets/sectors", label: "Sectors" },
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

export function quoteFundamentalsNav(symbol: string) {
  return [
    { href: `/stocks/${symbol}/market-cap`, label: "Market Cap" },
    { href: `/stocks/${symbol}/revenue`, label: "Revenue" },
    { href: `/stocks/${symbol}/net-income`, label: "Net Income" },
    { href: `/stocks/${symbol}/earnings`, label: "EPS" },
    { href: `/stocks/${symbol}/free-cash-flow`, label: "FCF" },
    { href: `/stocks/${symbol}/pe-ratio`, label: "PE Ratio" },
    { href: `/stocks/${symbol}/employees`, label: "Employees" },
    { href: `/stocks/${symbol}/ownership`, label: "Ownership" },
  ];
}
