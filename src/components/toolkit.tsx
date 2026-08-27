import Link from "next/link";
import { BarChart3, Building2, CalendarDays, Clock, GitCompareArrows, Landmark, Layers, Percent } from "lucide-react";

const TOOLS = [
  {
    href: "/screener",
    title: "Stock Screener",
    body: "Filter thousands of stocks by market cap, sector, industry, beta, volume, and yield.",
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
