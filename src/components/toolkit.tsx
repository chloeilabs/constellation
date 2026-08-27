import Link from "next/link";
import { BarChart3, Bitcoin, Building2, Calculator, CalendarDays, Clock, Coins, GitCompareArrows, Landmark, Layers, Percent, Search, TrendingUp } from "lucide-react";

const TOOLS = [
  {
    href: "/screener",
    title: "Stock Screener",
    body: "Filter thousands of stocks by market cap, sector, industry, index membership, beta, volume, and yield.",
    icon: BarChart3,
  },
  {
    href: "/stocks/industry",
    title: "Sectors & Industries",
    body: "Browse every industry grouped by sector, with combined market cap and daily moves.",
    icon: Layers,
  },
  {
    href: "/list/biggest-companies",
    title: "Biggest Companies",
    body: "See the largest U.S. companies ranked by market capitalization.",
    icon: Building2,
  },
  {
    href: "/list/dividend-aristocrats",
    title: "Dividend Aristocrats",
    body: "S&P 500 companies with 25+ years of dividend increases, with live quotes.",
    icon: Percent,
  },
  {
    href: "/list/monthly-dividend-stocks",
    title: "Monthly Dividends",
    body: "U.S. stocks that pay a dividend every month, ranked by indicated yield.",
    icon: CalendarDays,
  },
  {
    href: "/markets/premarket",
    title: "Pre-Market & After Hours",
    body: "Extended-hours last sale versus the regular close, from FMP aftermarket prints.",
    icon: Clock,
  },
  {
    href: "/markets/treasury",
    title: "U.S. Treasury Yields",
    body: "The live Treasury curve, from 1-month bills through the 30-year bond.",
    icon: Landmark,
  },
  {
    href: "/etf/lookup",
    title: "Reverse ETF Lookup",
    body: "Find U.S. ETFs that hold a stock, ranked by the market value of that position.",
    icon: Search,
  },
  {
    href: "/list/bitcoin-etfs",
    title: "Bitcoin ETFs",
    body: "U.S. bitcoin spot and futures ETFs ranked by market value from live FMP quotes.",
    icon: Bitcoin,
  },
  {
    href: "/list/top-rated-dividend-stocks",
    title: "Top-Rated Dividend Stocks",
    body: "Highest FMP ratings among large U.S. dividend payers in the mega-issuer set.",
    icon: Coins,
  },
  {
    href: "/etf/compare",
    title: "Compare ETFs",
    body: "Side-by-side expense ratios, total returns, and overlapping holdings from live FMP data.",
    icon: GitCompareArrows,
  },
  {
    href: "/tools/cagr",
    title: "CAGR Calculator",
    body: "Compound annual growth from live FMP daily closes for any stock, ETF, or fund.",
    icon: Calculator,
  },
  {
    href: "/tools/return-calculator",
    title: "Return Calculator",
    body: "Price and total return between two dates from live closes, including cash dividends.",
    icon: TrendingUp,
  },
  {
    href: "/compare",
    title: "Compare Stocks",
    body: "Compare prices, cash flow, valuation, ROE, and dividend yield side by side.",
    icon: GitCompareArrows,
  },
];

export function Toolkit() {
  return (
    <section>
      <h2 className="mb-4 text-xl font-semibold text-header">Stock Analysis Toolkit</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {TOOLS.map((tool) => (
          <Link
            key={tool.href}
            href={tool.href}
            className="rounded-lg border border-border p-4 hover:border-border-strong hover:bg-muted-bg"
          >
            <tool.icon className="mb-3 h-5 w-5 text-brand" />
            <h3 className="font-semibold text-header">{tool.title}</h3>
            <p className="mt-1 text-sm text-muted">{tool.body}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
