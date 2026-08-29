import Link from "next/link";
import { Container } from "@/components/container";
import { PageHeader } from "@/components/page-header";
import { Toolkit } from "@/components/toolkit";

export const metadata = {
  title: "Tools",
  description: "Stock and ETF screeners, comparison tools, CAGR and return calculators, and symbol lookup.",
};

const GROUPS = [
  {
    title: "Screeners",
    links: [
      ["/screener", "Stock Screener", "Filter stocks by market cap, sector, industry, index membership, beta, volume, and yield."],
      ["/screener?type=etf", "ETF Screener", "Explore U.S. ETFs ranked by assets with the same live FMP screener."],
      ["/screener?type=fund", "Mutual Fund Screener", "Search mutual funds by assets, industry, and indicated yield."],
      ["/ipos", "IPO Screener", "Recent and upcoming IPOs from the FMP IPO calendar."],
    ],
  },
  {
    title: "Comparison Tools",
    links: [
      ["/compare", "Stock Comparison", "Side-by-side quotes, a normalized performance chart, and trailing financials."],
      ["/stocks/AAPL/fundamental-chart", "Fundamental Chart", "Plot live FMP income, cash-flow, and valuation history with a period-end price overlay."],
      ["/etf/compare", "ETF Comparison", "Compare expense ratios, returns, and overlapping holdings."],
    ],
  },
  {
    title: "Calculators",
    links: [
      ["/tools/cagr", "CAGR Calculator", "Compound annual growth from live FMP daily closes."],
      ["/tools/return-calculator", "Return Calculator", "Price and total return for a live ticker, including cash dividends."],
      ["/tools/dividend-calculator", "Dividend Calculator", "Estimate income from the latest indicated dividend."],
    ],
  },
  {
    title: "Lookup Tools",
    links: [
      ["/search", "Symbol Lookup", "Search tickers, company names, CIK, CUSIP, ISIN, ETFs, funds, crypto, and forex."],
      ["/etf/lookup", "ETF Reverse Lookup", "Find U.S. ETFs that hold a stock, ranked by position value."],
      ["/stocks/country", "Country Stocks", "Largest listings on Korea, Taiwan, Switzerland, and other local exchanges."],
      ["/markets/hours", "Market Hours", "Live open/closed status, session times, and upcoming U.S. holidays."],
      ["/list/exchanges", "Stock Exchanges", "Global venues with ticker suffixes, quote delay, and live session status."],
      ["/markets/indexes", "Market Indexes", "S&P 500, Dow, Nasdaq, and global indexes with live FMP quotes."],
    ],
  },
] as const;

export default function ToolsPage() {
  return (
    <Container>
      <PageHeader
        title="Tools"
        description="Screen stocks, compare ETFs, calculate returns from live prices, and look up ETF holders."
      />
      <div className="flex flex-col gap-10">
        {GROUPS.map((group) => (
          <section key={group.title}>
            <h2 className="mb-4 text-xl font-semibold text-header">{group.title}</h2>
            <div className="grid gap-4 md:grid-cols-2">
              {group.links.map(([href, title, body]) => (
                <Link
                  key={href}
                  href={href}
                  className="sa-card p-5"
                >
                  <h3 className="font-semibold text-header">{title}</h3>
                  <p className="mt-2 text-sm text-muted">{body}</p>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
      <div className="mt-12">
        <Toolkit />
      </div>
    </Container>
  );
}
