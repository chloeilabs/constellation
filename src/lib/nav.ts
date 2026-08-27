export const MARKET_NAV = [
  { href: "/markets", label: "Overview" },
  { href: "/markets/heatmap", label: "Heatmap" },
  { href: "/markets/gainers", label: "Gainers" },
  { href: "/markets/losers", label: "Losers" },
  { href: "/markets/active", label: "Most Active" },
  { href: "/markets/sectors", label: "Sectors" },
];

export const CALENDAR_NAV = [
  { href: "/calendar/earnings", label: "Earnings" },
  { href: "/calendar/ipos", label: "IPOs" },
  { href: "/calendar/dividends", label: "Dividends" },
  { href: "/calendar/splits", label: "Splits" },
  { href: "/calendar/economy", label: "Economy" },
  { href: "/actions", label: "Actions" },
];

export function quoteFundamentalsNav(symbol: string) {
  return [
    { href: `/stocks/${symbol}/market-cap`, label: "Market Cap" },
    { href: `/stocks/${symbol}/revenue`, label: "Revenue" },
    { href: `/stocks/${symbol}/employees`, label: "Employees" },
    { href: `/stocks/${symbol}/ownership`, label: "Ownership" },
  ];
}
