# Stock Analysis

A [stockanalysis.com](https://stockanalysis.com/) clone: search, quotes, financial statements, ratios, news, a stock screener, market movers, and earnings/IPO calendars. Market data comes from the [Financial Modeling Prep](https://site.financialmodelingprep.com/api-docs.md) stable API.

## Setup

1. Copy `.env.example` to `.env.local`.
2. Add a key from the [FMP dashboard](https://site.financialmodelingprep.com/developer/docs):

```bash
FMP_API_KEY=your_key_here
```

The key is server-only. Client search and watchlist calls go through Next.js route handlers so the key is never exposed to the browser.

3. Install and run:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## What is included

| Route | Source |
| --- | --- |
| `/` | Index quotes, top gainers/losers, market news, IPOs |
| `/stocks/[symbol]` | Quote, chart, key stats, about, analysts, peers, news |
| `/stocks/[symbol]/financials` | Income, balance sheet, cash flow, ratios (annual/quarterly) |
| `/stocks/[symbol]/statistics` | TTM valuation and profitability |
| `/stocks/[symbol]/forecast` | Price targets, grades, estimates |
| `/stocks/[symbol]/dividend` | Dividend history |
| `/screener` | FMP company screener |
| `/markets` | Gainers, losers, most active, sectors |
| `/news` | Latest stock news |
| `/calendar/earnings` | Earnings calendar |
| `/calendar/ipos` | IPO calendar |
| `/watchlist` | Browser-local watchlist |
| `/compare` | Side-by-side quotes |

## Notes

- Quotes revalidate about every 30 seconds; statements about every hour.
- This is research software, not investment advice.
