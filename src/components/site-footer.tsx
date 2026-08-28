import Link from "next/link";

const columns = [
  {
    title: "Markets",
    links: [
      ["/markets", "Market Overview"],
      ["/markets/global", "World Markets"],
      ["/markets/hours", "Market Hours"],
      ["/markets/indexes", "Market Indexes"],
      ["/markets/gainers", "Top Gainers"],
      ["/markets/losers", "Top Losers"],
      ["/markets/active", "Most Active"],
      ["/markets/heatmap", "Heatmap"],
      ["/markets/premarket", "Pre-Market"],
      ["/markets/afterhours", "After Hours"],
      ["/markets/index-changes", "Index Changes"],
      ["/markets/sectors", "Sectors"],
      ["/markets/industries", "Industries"],
      ["/markets/treasury", "Treasury Yields"],
      ["/markets/commodities", "Commodities"],
      ["/markets/crypto", "Cryptocurrency"],
      ["/markets/forex", "Forex"],
    ],
  },
  {
    title: "Stocks",
    links: [
      ["/stocks", "Stock List"],
      ["/stocks/sector", "Sectors"],
      ["/stocks/industry", "Sectors & Industries"],
      ["/stocks/country", "Country Stocks"],
      ["/list/exchanges", "Stock Exchanges"],
      ["/list/sp-500-stocks", "S&P 500"],
      ["/list/nasdaq-100-stocks", "Nasdaq 100"],
      ["/list/dow-jones-stocks", "Dow Jones"],
      ["/list/biggest-companies", "Biggest Companies"],
      ["/list/highest-revenue", "Highest Revenue"],
      ["/list/highest-profit", "Most Profitable"],
      ["/list/highest-employees", "Most Employees"],
      ["/list/highest-taxes", "Highest Taxes"],
      ["/list/top-rated", "Highest Rated"],
      ["/list/top-rated-dividend-stocks", "Top-Rated Dividends"],
      ["/list/oldest-companies", "Oldest Companies"],
      ["/list/foreign-stocks", "Foreign on U.S. Exchanges"],
      ["/list/monthly-dividend-stocks", "Monthly Dividends"],
      ["/list/dividend-aristocrats", "Dividend Aristocrats"],
      ["/list/dividend-kings", "Dividend Kings"],
      ["/list/52-week-high", "52-Week Highs"],
      ["/list/52-week-low", "52-Week Lows"],
      ["/list/nasdaq-stocks", "NASDAQ Stocks"],
      ["/list/nyse-stocks", "NYSE Stocks"],
      ["/list/otc-stocks", "OTC Stocks"],
      ["/list/penny-stocks", "Penny Stocks"],
      ["/list/high-beta-stocks", "High-Beta Stocks"],
      ["/list/magnificent-seven", "Magnificent Seven"],
      ["/list/faang", "FAANG"],
      ["/list/highest-volume", "Highest Volume"],
      ["/list/ai-stocks", "AI Stocks"],
      ["/list/cloud-stocks", "Cloud Computing"],
      ["/list/healthcare-stocks", "Healthcare"],
      ["/list/glp1-stocks", "GLP-1 Stocks"],
      ["/list/apparel-stocks", "Apparel & Luxury"],
      ["/list/chemical-stocks", "Chemicals"],
      ["/list/waste-management-stocks", "Waste Management"],
      ["/list/bdc-stocks", "BDC Stocks"],
      ["/list/cef-funds", "Closed-End Funds"],
      ["/list/preferred-stocks", "Preferred Stocks"],
      ["/list/fintech-stocks", "Fintech"],
      ["/list/commodity-etfs", "Commodity ETFs"],
      ["/list/reit-stocks", "REITs"],
      ["/list/bank-stocks", "Banks"],
      ["/list/semiconductor-stocks", "Semiconductors"],
      ["/list/software-stocks", "Software"],
      ["/list/biotech-stocks", "Biotech"],
      ["/list/auto-stocks", "Car Companies"],
      ["/list/pharma-stocks", "Pharmaceuticals"],
      ["/list/sector-etfs", "Sector ETFs"],
      ["/list/micro-cap-stocks", "Micro-Cap"],
      ["/list/nano-cap-stocks", "Nano-Cap"],
      ["/list/tsx-stocks", "Toronto (TSX)"],
      ["/list/london-stocks", "London (LSE)"],
      ["/list/hong-kong-stocks", "Hong Kong"],
      ["/list/australia-stocks", "Australia (ASX)"],
      ["/list/germany-stocks", "Germany (Xetra)"],
      ["/list/japan-stocks", "Tokyo (JPX)"],
      ["/list/india-stocks", "India (NSE)"],
      ["/list/france-stocks", "Paris (Euronext)"],
      ["/list/brazil-stocks", "Brazil (B3)"],
      ["/etf", "ETFs"],
      ["/list/vanguard-etfs", "Vanguard ETFs"],
      ["/list/ishares-etfs", "iShares ETFs"],
      ["/list/spdr-etfs", "SPDR ETFs"],
      ["/list/invesco-etfs", "Invesco ETFs"],
      ["/list/schwab-etfs", "Schwab ETFs"],
      ["/list/dividend-etfs", "Dividend ETFs"],
      ["/list/bond-etfs", "Bond ETFs"],
      ["/list/income-etfs", "Equity Income ETFs"],
      ["/list/crypto-etfs", "Crypto ETFs"],
      ["/list/bitcoin-etfs", "Bitcoin ETFs"],
      ["/list/ethereum-etfs", "Ethereum ETFs"],
      ["/list/leveraged-etfs", "Leveraged ETFs"],
      ["/funds", "Mutual Funds"],
      ["/screener", "Stock Screener"],
    ],
  },
  {
    title: "News & Calendar",
    links: [
      ["/news", "Market News"],
      ["/news/press-releases", "Press Releases"],
      ["/news/filings", "SEC Filings"],
      ["/news/crypto", "Crypto News"],
      ["/news/forex", "Forex News"],
      ["/news/transcripts", "Transcripts"],
      ["/analysts", "Analyst Ratings"],
      ["/ipos", "Recent IPOs"],
      ["/calendar/earnings", "Earnings Calendar"],
      ["/calendar/earnings?view=reported", "Just Reported"],
      ["/calendar/ipos", "IPO Calendar"],
      ["/calendar/dividends", "Dividend Calendar"],
      ["/calendar/splits", "Stock Splits"],
      ["/calendar/economy", "Economic Calendar"],
      ["/actions", "Corporate Actions"],
      ["/insider-trading", "Insider Trading"],
      ["/congress", "Congressional Trades"],
      ["/congress/nancy-pelosi", "Nancy Pelosi Trades"],
      ["/institutional", "13F Filings"],
      ["/institutional/0001067983", "Berkshire 13F"],
    ],
  },
  {
    title: "Tools",
    links: [
      ["/tools", "All Tools"],
      ["/watchlist", "Watchlist"],
      ["/compare", "Compare Stocks"],
      ["/stocks/AAPL/fundamental-chart", "Fundamental Chart"],
      ["/compare/aapl-vs-msft", "AAPL vs MSFT"],
      ["/etf/compare", "Compare ETFs"],
      ["/screener", "Screener"],
      ["/screener?type=etf", "ETF Screener"],
      ["/etf/lookup", "Reverse ETF Lookup"],
      ["/tools/cagr", "CAGR Calculator"],
      ["/tools/return-calculator", "Return Calculator"],
      ["/tools/dividend-calculator", "Dividend Calculator"],
      ["/search", "Search"],
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
            <ul className="flex flex-col gap-2 text-sm text-muted">
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
