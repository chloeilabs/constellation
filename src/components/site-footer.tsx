import Link from "next/link";

const columns = [
  {
    title: "Markets",
    links: [
      ["/markets", "Market Overview"],
      ["/markets/gainers", "Top Gainers"],
      ["/markets/losers", "Top Losers"],
      ["/markets/active", "Most Active"],
      ["/markets/sectors", "Sectors"],
    ],
  },
  {
    title: "Stocks",
    links: [
      ["/stocks", "Stock List"],
      ["/list/sp-500-stocks", "S&P 500"],
      ["/list/nasdaq-100-stocks", "Nasdaq 100"],
      ["/list/dow-jones-stocks", "Dow Jones"],
      ["/list/biggest-companies", "Biggest Companies"],
      ["/list/nasdaq-stocks", "NASDAQ Stocks"],
      ["/list/nyse-stocks", "NYSE Stocks"],
      ["/etf", "ETFs"],
      ["/screener", "Stock Screener"],
    ],
  },
  {
    title: "News & Calendar",
    links: [
      ["/news", "Market News"],
      ["/calendar/earnings", "Earnings Calendar"],
      ["/calendar/ipos", "IPO Calendar"],
      ["/calendar/dividends", "Dividend Calendar"],
      ["/calendar/splits", "Stock Splits"],
      ["/calendar/economy", "Economic Calendar"],
      ["/insider-trading", "Insider Trading"],
    ],
  },
  {
    title: "Tools",
    links: [
      ["/watchlist", "Watchlist"],
      ["/compare", "Compare Stocks"],
      ["/screener", "Screener"],
    ],
  },
] as const;

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-border bg-muted-bg">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:grid-cols-2 lg:grid-cols-4">
        {columns.map((column) => (
          <div key={column.title}>
            <h3 className="mb-3 text-sm font-semibold text-header">{column.title}</h3>
            <ul className="space-y-2 text-sm text-muted">
              {column.links.map(([href, label]) => (
                <li key={href}>
                  <Link href={href} className="hover:text-link">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-border px-4 py-4 text-center text-xs text-muted">
        Stock Analysis clone for research and education. Market data from{" "}
        <a className="text-link hover:underline" href="https://site.financialmodelingprep.com/">
          Financial Modeling Prep
        </a>
        . Not investment advice.
      </div>
    </footer>
  );
}
