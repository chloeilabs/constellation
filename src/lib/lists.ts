import { getDividendCalendar, getIndexConstituents, getIncomeTtm, getProfile, getQuotes, getRatings, getScreener, getScreenerPages } from "@/lib/fmp";
import { isForeignListingSymbol, parseFoundedYear, preferPrimaryListings, uniqueBySymbol } from "@/lib/listings";
import { addDays, annualDividendPayments, isoDate, nyDateString } from "@/lib/utils";
import type { SymbolTableRow } from "@/components/symbol-table";
import type { FmpScreenerRow } from "@/lib/types";
import type { FmpIndexKey } from "@/lib/indexes";

type ListCategory = "popular" | "index" | "exchange" | "market-cap" | "etf" | "international";

type ScreenerList = {
  title: string;
  description: string;
  category: ListCategory;
  source: "screener";
  filters: Record<string, string | number | boolean>;
  limit: number;
  sort?: "marketCap" | "dividendYield" | "volume";
  listing?: "primary" | "raw";
  hrefBase?: "/stocks" | "/etf" | "/funds";
  yieldMax?: number;
  symbolPattern?: string;
  namePattern?: string;
  capMax?: number;
};

type ConstituentList = {
  title: string;
  description: string;
  category: ListCategory;
  source: "constituents";
  index: "sp500" | "nasdaq" | "dow";
};

type CalendarList = {
  title: string;
  description: string;
  category: ListCategory;
  source: "monthly-dividends";
};

type OldestList = {
  title: string;
  description: string;
  category: ListCategory;
  source: "oldest";
};

type OtcList = {
  title: string;
  description: string;
  category: ListCategory;
  source: "otc";
};

type ForeignList = {
  title: string;
  description: string;
  category: ListCategory;
  source: "foreign-us";
  originCountry?: string;
};

type SymbolsList = {
  title: string;
  description: string;
  category: ListCategory;
  source: "symbols";
  symbols: readonly string[];
  hrefBase?: "/stocks" | "/etf" | "/funds";
};

type EtfIssuerList = {
  title: string;
  description: string;
  category: ListCategory;
  source: "etf-issuer";
  namePattern: string;
  hrefBase: "/etf";
};

type WeekRangeList = {
  title: string;
  description: string;
  category: ListCategory;
  source: "week-range";
  direction: "high" | "low";
};

type IndustryMatchList = {
  title: string;
  description: string;
  category: ListCategory;
  source: "industry-match";
  sector?: string;
  industryPattern: string;
  hrefBase?: "/stocks" | "/etf" | "/funds";
};

type FundamentalsRankList = {
  title: string;
  description: string;
  category: ListCategory;
  source: "fundamentals-rank";
  rank: "revenue" | "employees" | "tax" | "profit";
};

type RatingsRankList = {
  title: string;
  description: string;
  category: ListCategory;
  source: "ratings-rank";
  dividendOnly?: boolean;
};

type StockList =
  | ScreenerList
  | ConstituentList
  | CalendarList
  | OldestList
  | OtcList
  | ForeignList
  | SymbolsList
  | EtfIssuerList
  | WeekRangeList
  | IndustryMatchList
  | FundamentalsRankList
  | RatingsRankList;

export const STOCK_LISTS = {
  "sp-500-stocks": {
    title: "S&P 500 Stocks",
    description: "Companies in the S&P 500, ranked by market capitalization.",
    category: "index",
    source: "constituents",
    index: "sp500",
  },
  "nasdaq-100-stocks": {
    title: "Nasdaq 100 Stocks",
    description: "The Nasdaq-100 constituents, ranked by market capitalization.",
    category: "index",
    source: "constituents",
    index: "nasdaq",
  },
  "dow-jones-stocks": {
    title: "Dow Jones Stocks",
    description: "The 30 companies in the Dow Jones Industrial Average.",
    category: "index",
    source: "constituents",
    index: "dow",
  },
  "biggest-companies": {
    title: "Biggest Companies",
    description: "The largest U.S. companies ranked by market capitalization.",
    category: "popular",
    source: "screener",
    filters: { country: "US" },
    limit: 100,
    sort: "marketCap",
  },
  "highest-revenue": {
    title: "Highest Revenue",
    description:
      "Major U.S. listed companies ranked by trailing-twelve-month revenue from live FMP filings. FMP has no bulk revenue screener, so this ranks a Fortune-style mega-issuer set rather than every U.S. listing.",
    category: "popular",
    source: "fundamentals-rank",
    rank: "revenue",
  },
  "highest-employees": {
    title: "Most Employees",
    description:
      "Major U.S. listed companies ranked by reported headcount from live FMP profiles.",
    category: "popular",
    source: "fundamentals-rank",
    rank: "employees",
  },
  "highest-taxes": {
    title: "Highest Income Taxes",
    description:
      "Major U.S. listed companies ranked by trailing income-tax expense from live FMP filings.",
    category: "popular",
    source: "fundamentals-rank",
    rank: "tax",
  },
  "highest-profit": {
    title: "Most Profitable",
    description:
      "Major U.S. listed companies ranked by trailing-twelve-month net income from live FMP filings. FMP has no bulk earnings screener, so this ranks a Fortune-style mega-issuer set rather than every U.S. listing.",
    category: "popular",
    source: "fundamentals-rank",
    rank: "profit",
  },
  "top-rated": {
    title: "Highest Rated Stocks",
    description:
      "Major U.S. listed companies ranked by FMP financial ratings (overall score). FMP has no bulk ratings screener, so this ranks a Fortune-style mega-issuer set rather than every U.S. listing.",
    category: "popular",
    source: "ratings-rank",
  },
  "top-rated-dividend-stocks": {
    title: "Top-Rated Dividend Stocks",
    description:
      "Highest FMP financial ratings among a Fortune-style mega-issuer set that also pays a dividend yield of at least 1%. Not a full-universe ratings scan.",
    category: "popular",
    source: "ratings-rank",
    dividendOnly: true,
  },
  "oldest-companies": {
    title: "Oldest S&P 500 Companies",
    description: "The 100 oldest companies in the S&P 500, ranked by founding year from FMP constituent data.",
    category: "popular",
    source: "oldest",
  },
  "highest-dividend": {
    title: "Highest Dividend Stocks",
    description: "U.S. stocks with the highest indicated dividend yield.",
    category: "popular",
    source: "screener",
    filters: { country: "US", dividendMoreThan: 0.01 },
    limit: 400,
    sort: "dividendYield",
  },
  "monthly-dividend-stocks": {
    title: "Monthly Dividend Stocks",
    description: "U.S. stocks that currently pay a monthly dividend, ranked by indicated yield.",
    category: "popular",
    source: "monthly-dividends",
  },
  "foreign-stocks": {
    title: "Foreign Stocks on U.S. Exchanges",
    description: "The largest non-U.S. companies listed on the NYSE, NASDAQ, or NYSE American.",
    category: "popular",
    source: "foreign-us",
  },
  "canadian-stocks-us": {
    title: "Canadian Stocks on U.S. Exchanges",
    description: "The largest Canadian companies listed on the NYSE, NASDAQ, or NYSE American.",
    category: "popular",
    source: "foreign-us",
    originCountry: "CA",
  },
  "chinese-stocks-us": {
    title: "Chinese Stocks on U.S. Exchanges",
    description: "The largest Chinese companies listed on the NYSE, NASDAQ, or NYSE American.",
    category: "popular",
    source: "foreign-us",
    originCountry: "CN",
  },
  "indian-stocks-us": {
    title: "Indian Stocks on U.S. Exchanges",
    description: "The largest Indian companies listed on the NYSE, NASDAQ, or NYSE American.",
    category: "popular",
    source: "foreign-us",
    originCountry: "IN",
  },
  "irish-stocks-us": {
    title: "Irish Stocks on U.S. Exchanges",
    description: "The largest Irish companies listed on the NYSE, NASDAQ, or NYSE American.",
    category: "popular",
    source: "foreign-us",
    originCountry: "IE",
  },
  "israeli-stocks-us": {
    title: "Israeli Stocks on U.S. Exchanges",
    description: "The largest Israeli companies listed on the NYSE, NASDAQ, or NYSE American.",
    category: "popular",
    source: "foreign-us",
    originCountry: "IL",
  },
  "uk-stocks-us": {
    title: "U.K. Stocks on U.S. Exchanges",
    description: "The largest U.K. companies listed on the NYSE, NASDAQ, or NYSE American.",
    category: "popular",
    source: "foreign-us",
    originCountry: "GB",
  },
  "nasdaq-stocks": {
    title: "NASDAQ Stocks",
    description: "The largest companies listed on the NASDAQ.",
    category: "exchange",
    source: "screener",
    filters: { country: "US", exchange: "NASDAQ" },
    limit: 100,
    sort: "marketCap",
  },
  "nyse-stocks": {
    title: "NYSE Stocks",
    description: "The largest companies listed on the New York Stock Exchange.",
    category: "exchange",
    source: "screener",
    filters: { country: "US", exchange: "NYSE" },
    limit: 100,
    sort: "marketCap",
  },
  "nyse-american-stocks": {
    title: "NYSE American Stocks",
    description: "The largest companies listed on NYSE American (AMEX).",
    category: "exchange",
    source: "screener",
    filters: { country: "US", exchange: "AMEX" },
    limit: 100,
    sort: "marketCap",
  },
  "otc-stocks": {
    title: "OTC Stocks",
    description: "The largest U.S. companies quoted on OTC Markets, ranked by market capitalization.",
    category: "exchange",
    source: "otc",
  },
  "mega-cap-stocks": {
    title: "Mega-Cap Stocks",
    description: "U.S. companies with a market cap of $200 billion or more.",
    category: "market-cap",
    source: "screener",
    filters: { country: "US", marketCapMoreThan: 200_000_000_000 },
    limit: 100,
    sort: "marketCap",
  },
  "large-cap-stocks": {
    title: "Large-Cap Stocks",
    description: "U.S. companies with a market cap between $10 billion and $200 billion.",
    category: "market-cap",
    source: "screener",
    filters: { country: "US", marketCapMoreThan: 10_000_000_000, marketCapLowerThan: 200_000_000_000 },
    limit: 100,
    sort: "marketCap",
  },
  "mid-cap-stocks": {
    title: "Mid-Cap Stocks",
    description: "U.S. companies with a market cap between $2 billion and $10 billion.",
    category: "market-cap",
    source: "screener",
    filters: { country: "US", marketCapMoreThan: 2_000_000_000, marketCapLowerThan: 10_000_000_000 },
    limit: 100,
    sort: "marketCap",
  },
  "small-cap-stocks": {
    title: "Small-Cap Stocks",
    description: "U.S. companies with a market cap between $300 million and $2 billion.",
    category: "market-cap",
    source: "screener",
    filters: { country: "US", marketCapMoreThan: 300_000_000, marketCapLowerThan: 2_000_000_000 },
    limit: 100,
    sort: "marketCap",
  },
  "micro-cap-stocks": {
    title: "Micro-Cap Stocks",
    description: "U.S. companies with a market cap between $50 million and $300 million.",
    category: "market-cap",
    source: "screener",
    filters: { country: "US", marketCapMoreThan: 50_000_000, marketCapLowerThan: 300_000_000, priceMoreThan: 1 },
    limit: 200,
    sort: "marketCap",
    listing: "primary",
  },
  "nano-cap-stocks": {
    title: "Nano-Cap Stocks",
    description: "U.S. companies with a market cap between $15 million and $50 million.",
    category: "market-cap",
    source: "screener",
    filters: { country: "US", marketCapMoreThan: 15_000_000, marketCapLowerThan: 50_000_000, priceMoreThan: 1 },
    limit: 200,
    sort: "marketCap",
    listing: "primary",
  },
  "dividend-etfs": {
    title: "Dividend ETFs",
    description: "U.S. ETFs ranked by indicated dividend yield from FMP screener data.",
    category: "etf",
    source: "screener",
    filters: { isEtf: true, isFund: false, country: "US", dividendMoreThan: 0.01 },
    limit: 200,
    sort: "dividendYield",
    listing: "primary",
    hrefBase: "/etf",
    yieldMax: 0.15,
  },
  "bond-etfs": {
    title: "Bond ETFs",
    description: "The largest U.S. fixed-income ETFs, ranked by market value.",
    category: "etf",
    source: "screener",
    filters: { isEtf: true, isFund: false, country: "US", industry: "Asset Management - Bonds" },
    limit: 100,
    sort: "marketCap",
    listing: "primary",
    hrefBase: "/etf",
  },
  "income-etfs": {
    title: "Equity Income ETFs",
    description: "U.S. equity-income ETFs, including covered-call and high-dividend funds.",
    category: "etf",
    source: "screener",
    filters: { isEtf: true, isFund: false, country: "US", industry: "Asset Management - Income" },
    limit: 100,
    sort: "dividendYield",
    listing: "primary",
    hrefBase: "/etf",
    yieldMax: 0.15,
  },
  "crypto-etfs": {
    title: "Crypto ETFs",
    description: "U.S. bitcoin, ether, and other digital-asset ETFs ranked by market value.",
    category: "etf",
    source: "screener",
    filters: { isEtf: true, isFund: false, country: "US", industry: "Asset Management - Cryptocurrency" },
    limit: 100,
    sort: "marketCap",
    listing: "primary",
    hrefBase: "/etf",
  },
  "bitcoin-etfs": {
    title: "Bitcoin ETFs",
    description: "U.S. bitcoin spot and futures ETFs, ranked by market value from FMP.",
    category: "etf",
    source: "screener",
    filters: { isEtf: true, isFund: false, country: "US", industry: "Asset Management - Cryptocurrency" },
    limit: 100,
    sort: "marketCap",
    listing: "primary",
    hrefBase: "/etf",
    namePattern: "Bitcoin|BTC",
  },
  "ethereum-etfs": {
    title: "Ethereum ETFs",
    description: "U.S. ether spot and futures ETFs, ranked by market value from FMP.",
    category: "etf",
    source: "screener",
    filters: { isEtf: true, isFund: false, country: "US", industry: "Asset Management - Cryptocurrency" },
    limit: 100,
    sort: "marketCap",
    listing: "primary",
    hrefBase: "/etf",
    namePattern: "Ethereum|Ether",
  },
  "solana-etfs": {
    title: "Solana ETFs",
    description: "U.S. Solana-linked ETFs ranked by market value from FMP.",
    category: "etf",
    source: "screener",
    filters: { isEtf: true, isFund: false, country: "US", industry: "Asset Management - Cryptocurrency" },
    limit: 100,
    sort: "marketCap",
    listing: "primary",
    hrefBase: "/etf",
    namePattern: "Solana",
  },
  "xrp-etfs": {
    title: "XRP ETFs",
    description: "U.S. XRP-linked ETFs ranked by market value from FMP.",
    category: "etf",
    source: "screener",
    filters: { isEtf: true, isFund: false, country: "US", industry: "Asset Management - Cryptocurrency" },
    limit: 100,
    sort: "marketCap",
    listing: "primary",
    hrefBase: "/etf",
    namePattern: "XRP|Ripple",
  },
  "leveraged-etfs": {
    title: "Leveraged ETFs",
    description: "U.S. leveraged and inverse equity ETFs, ranked by market value.",
    category: "etf",
    source: "screener",
    filters: { isEtf: true, isFund: false, country: "US", industry: "Asset Management - Leveraged" },
    limit: 100,
    sort: "marketCap",
    listing: "primary",
    hrefBase: "/etf",
    capMax: 40_000_000_000,
  },
  "penny-stocks": {
    title: "Penny Stocks",
    description: "U.S.-listed companies trading below $5, ranked by market capitalization.",
    category: "popular",
    source: "screener",
    filters: { country: "US", priceMoreThan: 0.5, priceLowerThan: 5, marketCapMoreThan: 50_000_000 },
    limit: 200,
    sort: "marketCap",
    listing: "primary",
  },
  "high-beta-stocks": {
    title: "High-Beta Stocks",
    description: "U.S. stocks with a beta of 2 or higher, ranked by market capitalization.",
    category: "popular",
    source: "screener",
    filters: { country: "US", betaMoreThan: 2 },
    limit: 200,
    sort: "marketCap",
    listing: "primary",
  },
  "highest-volume": {
    title: "Highest Volume Stocks",
    description: "U.S. stocks with the highest regular-session volume, excluding micro-caps.",
    category: "popular",
    source: "screener",
    filters: { country: "US", volumeMoreThan: 5_000_000, marketCapMoreThan: 500_000_000 },
    limit: 200,
    sort: "volume",
    listing: "primary",
  },
  "magnificent-seven": {
    title: "Magnificent Seven",
    description: "Apple, Microsoft, Nvidia, Amazon, Alphabet, Meta, and Tesla, with live FMP quotes.",
    category: "popular",
    source: "symbols",
    symbols: ["NVDA", "AAPL", "MSFT", "GOOGL", "AMZN", "META", "TSLA"],
  },
  faang: {
    title: "FAANG Stocks",
    description: "Meta, Apple, Amazon, Netflix, and Alphabet, with live FMP quotes.",
    category: "popular",
    source: "symbols",
    symbols: ["META", "AAPL", "AMZN", "NFLX", "GOOGL"],
  },
  "reit-stocks": {
    title: "REIT Stocks",
    description: "The largest U.S. real estate investment trusts, ranked by market capitalization.",
    category: "popular",
    source: "industry-match",
    sector: "Real Estate",
    industryPattern: "^REIT",
  },
  "bank-stocks": {
    title: "Bank Stocks",
    description: "The largest U.S. diversified and regional banks, ranked by market capitalization.",
    category: "popular",
    source: "industry-match",
    sector: "Financial Services",
    industryPattern: "^Banks",
  },
  "auto-stocks": {
    title: "Car Companies",
    description: "U.S.-listed auto manufacturers, ranked by market capitalization.",
    category: "popular",
    source: "screener",
    filters: { country: "US", industry: "Auto - Manufacturers" },
    limit: 100,
    sort: "marketCap",
    listing: "primary",
  },
  "pharma-stocks": {
    title: "Pharmaceutical Stocks",
    description: "U.S. drug manufacturers, ranked by market capitalization.",
    category: "popular",
    source: "industry-match",
    sector: "Healthcare",
    industryPattern: "Drug Manufacturers|Medical - Pharmaceuticals",
  },
  "semiconductor-stocks": {
    title: "Semiconductor Stocks",
    description: "U.S. semiconductor companies, ranked by market capitalization.",
    category: "popular",
    source: "screener",
    filters: { country: "US", industry: "Semiconductors" },
    limit: 100,
    sort: "marketCap",
    listing: "primary",
  },
  "software-stocks": {
    title: "Software Stocks",
    description: "U.S. software companies, ranked by market capitalization.",
    category: "popular",
    source: "industry-match",
    sector: "Technology",
    industryPattern: "^Software",
  },
  "biotech-stocks": {
    title: "Biotech Stocks",
    description: "U.S. biotechnology companies, ranked by market capitalization.",
    category: "popular",
    source: "screener",
    filters: { country: "US", industry: "Biotechnology" },
    limit: 100,
    sort: "marketCap",
    listing: "primary",
  },
  "aerospace-defense-stocks": {
    title: "Aerospace & Defense Stocks",
    description: "U.S. aerospace and defense companies, ranked by market capitalization.",
    category: "popular",
    source: "screener",
    filters: { country: "US", industry: "Aerospace & Defense" },
    limit: 100,
    sort: "marketCap",
    listing: "primary",
  },
  "oil-gas-stocks": {
    title: "Oil & Gas Stocks",
    description: "The largest U.S. oil and gas companies, ranked by market capitalization.",
    category: "popular",
    source: "industry-match",
    sector: "Energy",
    industryPattern: "Oil & Gas",
  },
  "utilities-stocks": {
    title: "Utility Stocks",
    description: "U.S. electric, gas, and diversified utilities, ranked by market capitalization.",
    category: "popular",
    source: "industry-match",
    sector: "Utilities",
    industryPattern: "Utilities",
  },
  "insurance-stocks": {
    title: "Insurance Stocks",
    description: "U.S. insurers, ranked by market capitalization.",
    category: "popular",
    source: "industry-match",
    sector: "Financial Services",
    industryPattern: "^Insurance",
  },
  "airline-stocks": {
    title: "Airline Stocks",
    description: "U.S. passenger and cargo airlines, ranked by market capitalization.",
    category: "popular",
    source: "industry-match",
    sector: "Industrials",
    industryPattern: "Airline",
  },
  "gold-stocks": {
    title: "Gold Stocks",
    description: "U.S.-listed gold miners and royalty companies, ranked by market capitalization.",
    category: "popular",
    source: "industry-match",
    sector: "Basic Materials",
    industryPattern: "Gold",
  },
  "restaurant-stocks": {
    title: "Restaurant Stocks",
    description: "U.S. restaurant and food-service companies, ranked by market capitalization.",
    category: "popular",
    source: "industry-match",
    sector: "Consumer Cyclical",
    industryPattern: "Restaurant",
  },
  "solar-stocks": {
    title: "Solar Stocks",
    description: "U.S. solar companies, ranked by market capitalization.",
    category: "popular",
    source: "screener",
    filters: { country: "US", industry: "Solar" },
    limit: 100,
    sort: "marketCap",
    listing: "primary",
  },
  "steel-stocks": {
    title: "Steel Stocks",
    description: "U.S. steel companies, ranked by market capitalization.",
    category: "popular",
    source: "screener",
    filters: { country: "US", industry: "Steel" },
    limit: 100,
    sort: "marketCap",
    listing: "primary",
  },
  "uranium-stocks": {
    title: "Uranium Stocks",
    description: "U.S.-listed uranium companies, ranked by market capitalization.",
    category: "popular",
    source: "screener",
    filters: { country: "US", industry: "Uranium" },
    limit: 100,
    sort: "marketCap",
    listing: "primary",
  },
  "tobacco-stocks": {
    title: "Tobacco Stocks",
    description: "U.S. tobacco companies, ranked by market capitalization.",
    category: "popular",
    source: "screener",
    filters: { country: "US", industry: "Tobacco" },
    limit: 100,
    sort: "marketCap",
    listing: "primary",
  },
  "casino-stocks": {
    title: "Casino Stocks",
    description: "U.S. gambling, resort, and casino companies, ranked by market capitalization.",
    category: "popular",
    source: "screener",
    filters: { country: "US", industry: "Gambling, Resorts & Casinos" },
    limit: 100,
    sort: "marketCap",
    listing: "primary",
  },
  "shipping-stocks": {
    title: "Shipping Stocks",
    description: "U.S. marine shipping companies, ranked by market capitalization.",
    category: "popular",
    source: "screener",
    filters: { country: "US", industry: "Marine Shipping" },
    limit: 100,
    sort: "marketCap",
    listing: "primary",
  },
  "beverage-stocks": {
    title: "Beverage Stocks",
    description: "U.S. beverage companies, ranked by market capitalization.",
    category: "popular",
    source: "industry-match",
    sector: "Consumer Defensive",
    industryPattern: "Beverages",
  },
  "retail-stocks": {
    title: "Retail Stocks",
    description: "U.S. specialty and apparel retailers, ranked by market capitalization.",
    category: "popular",
    source: "industry-match",
    sector: "Consumer Cyclical",
    industryPattern: "Retail",
  },
  "ev-stocks": {
    title: "Electric Vehicle Stocks",
    description: "U.S.-listed auto makers with significant EV exposure, with live FMP quotes.",
    category: "popular",
    source: "symbols",
    symbols: ["TSLA", "GM", "F", "RIVN", "LCID", "NIO", "XPEV", "LI"],
  },
  "cybersecurity-stocks": {
    title: "Cybersecurity Stocks",
    description: "U.S. cybersecurity software and infrastructure companies, with live FMP quotes.",
    category: "popular",
    source: "symbols",
    symbols: ["CRWD", "PANW", "FTNT", "ZS", "CYBR", "OKTA", "CHKP", "S", "QLYS", "TENB", "RPD", "NET"],
  },
  "ai-stocks": {
    title: "Artificial Intelligence Stocks",
    description: "U.S.-listed companies with significant AI exposure, with live FMP quotes.",
    category: "popular",
    source: "symbols",
    symbols: ["NVDA", "MSFT", "GOOGL", "AMZN", "META", "AVGO", "AMD", "TSM", "PLTR", "SNOW", "CRWV", "ARM", "PATH", "SOUN"],
  },
  "cloud-stocks": {
    title: "Cloud Computing Stocks",
    description: "U.S.-listed cloud infrastructure and software companies, with live FMP quotes.",
    category: "popular",
    source: "symbols",
    symbols: ["AMZN", "MSFT", "GOOGL", "ORCL", "CRM", "NOW", "SNOW", "DDOG", "NET", "CFLT", "MDB", "ESTC", "TEAM", "WDAY"],
  },
  "social-media-stocks": {
    title: "Social Media Stocks",
    description: "U.S.-listed social and user-generated content platforms, with live FMP quotes.",
    category: "popular",
    source: "symbols",
    symbols: ["META", "GOOGL", "SNAP", "PINS", "RDDT", "MTCH"],
  },
  "streaming-stocks": {
    title: "Streaming Stocks",
    description: "U.S.-listed video, music, and live-entertainment streamers, with live FMP quotes.",
    category: "popular",
    source: "symbols",
    symbols: ["NFLX", "DIS", "WBD", "SPOT", "ROKU", "LYV", "PARA"],
  },
  "fintech-stocks": {
    title: "Fintech Stocks",
    description: "U.S. payments, brokerage, and digital-finance companies, with live FMP quotes.",
    category: "popular",
    source: "symbols",
    symbols: ["V", "MA", "AXP", "PYPL", "XYZ", "COIN", "HOOD", "AFRM", "SOFI", "TOST", "BILL"],
  },
  "advertising-stocks": {
    title: "Advertising Stocks",
    description: "U.S. advertising agencies and ad-tech companies, ranked by market capitalization.",
    category: "popular",
    source: "screener",
    filters: { country: "US", industry: "Advertising Agencies" },
    limit: 100,
    sort: "marketCap",
    listing: "primary",
  },
  "video-game-stocks": {
    title: "Video Game Stocks",
    description: "U.S. electronic gaming and interactive-media companies, ranked by market capitalization.",
    category: "popular",
    source: "screener",
    filters: { country: "US", industry: "Electronic Gaming & Multimedia" },
    limit: 100,
    sort: "marketCap",
    listing: "primary",
  },
  "healthcare-stocks": {
    title: "Healthcare Stocks",
    description: "The largest U.S. healthcare companies, ranked by market capitalization.",
    category: "popular",
    source: "industry-match",
    sector: "Healthcare",
    industryPattern: ".+",
  },
  "internet-stocks": {
    title: "Internet Stocks",
    description: "U.S. internet content and information companies, ranked by market capitalization.",
    category: "popular",
    source: "industry-match",
    sector: "Communication Services",
    industryPattern: "Internet Content",
  },
  "lithium-stocks": {
    title: "Lithium Stocks",
    description: "U.S.-listed lithium producers, with live FMP quotes.",
    category: "popular",
    source: "symbols",
    symbols: ["ALB", "SQM", "PLL", "SGML", "LAR"],
  },
  "copper-stocks": {
    title: "Copper Stocks",
    description: "U.S.-listed copper miners, ranked by market capitalization.",
    category: "popular",
    source: "screener",
    filters: { country: "US", industry: "Copper" },
    limit: 100,
    sort: "marketCap",
    listing: "primary",
  },
  "silver-stocks": {
    title: "Silver Stocks",
    description: "U.S.-listed silver miners, with live FMP quotes.",
    category: "popular",
    source: "symbols",
    symbols: ["PAAS", "CDE", "HL", "AG", "MAG", "SVM", "EXK", "FSM"],
  },
  "coal-stocks": {
    title: "Coal Stocks",
    description: "U.S. coal producers, ranked by market capitalization.",
    category: "popular",
    source: "screener",
    filters: { country: "US", industry: "Coal" },
    limit: 100,
    sort: "marketCap",
    listing: "primary",
  },
  "semiconductor-equipment-stocks": {
    title: "Semiconductor Equipment Stocks",
    description: "Chip-equipment makers listed in the U.S., with live FMP quotes.",
    category: "popular",
    source: "symbols",
    symbols: ["ASML", "AMAT", "LRCX", "KLAC", "TER", "ENTG", "ACLS", "ONTO"],
  },
  "cannabis-stocks": {
    title: "Cannabis Stocks",
    description: "U.S.-listed cannabis companies, with live FMP quotes.",
    category: "popular",
    source: "symbols",
    symbols: ["TLRY", "CGC", "CRON", "ACB", "SNDL"],
  },
  "commodity-etfs": {
    title: "Commodity ETFs",
    description: "U.S. gold, silver, oil, and broad-commodity ETFs, with live FMP quotes.",
    category: "etf",
    source: "symbols",
    hrefBase: "/etf",
    symbols: ["GLD", "IAU", "SLV", "USO", "UNG", "DBC", "PDBC", "CPER"],
  },
  "bdc-stocks": {
    title: "BDC Stocks",
    description: "Business development companies listed in the U.S., with live FMP quotes. FMP has no BDC industry screen, so this is a curated set.",
    category: "popular",
    source: "symbols",
    symbols: [
      "ARCC", "MAIN", "OBDC", "BXSL", "HTGC", "GBDC", "TSLX", "PSEC", "FSK", "CSWC",
      "OCSL", "NMFC", "GSBD", "BBDC", "TCPC",
    ],
  },
  "cef-funds": {
    title: "Closed-End Funds",
    description: "Widely held U.S. closed-end funds with live FMP quotes. FMP’s income-fund screener returns open-end mutual funds, so this list is curated.",
    category: "popular",
    source: "symbols",
    hrefBase: "/funds",
    symbols: [
      "PDI", "PTY", "PDO", "DNP", "UTF", "UTG", "RQI", "USA", "ADX", "EVT",
      "BDJ", "EXG", "ETY", "BST", "BSTZ", "QQQX", "BME", "ETG", "GAM", "TY",
      "CET", "PHK", "NUV", "NAD", "NEA", "NZF", "HYT", "DSL", "JPC", "OXLC",
    ],
  },
  "preferred-stocks": {
    title: "Preferred Stocks",
    description:
      "Selected U.S. preferred issues with live FMP quotes (BAC-PL style tickers). Share prices are the preferreds; FMP market-cap figures follow the parent common stock.",
    category: "popular",
    source: "symbols",
    symbols: [
      "BAC-PL", "BAC-PB", "WFC-PL", "WFC-PY", "JPM-PC", "JPM-PD", "GS-PA", "GS-PD",
      "MS-PI", "MS-PK", "C-PJ", "T-PC", "USB-PH", "NEE-PN", "SOJD",
    ],
  },
  "glp1-stocks": {
    title: "GLP-1 Stocks",
    description: "U.S.-listed companies tied to GLP-1 obesity and diabetes drugs, with live FMP quotes.",
    category: "popular",
    source: "symbols",
    symbols: ["LLY", "NVO", "AMGN", "VKTX", "GPCR", "TERN", "ALT"],
  },
  "waste-management-stocks": {
    title: "Waste Management Stocks",
    description: "U.S. waste management companies, ranked by market capitalization.",
    category: "popular",
    source: "screener",
    filters: { country: "US", industry: "Waste Management" },
    limit: 100,
    sort: "marketCap",
    listing: "primary",
  },
  "chemical-stocks": {
    title: "Chemical Stocks",
    description: "U.S. chemical companies, ranked by market capitalization.",
    category: "popular",
    source: "industry-match",
    sector: "Basic Materials",
    industryPattern: "Chemicals",
  },
  "apparel-stocks": {
    title: "Apparel & Luxury Stocks",
    description: "U.S. apparel, footwear, and luxury-goods companies, ranked by market capitalization.",
    category: "popular",
    source: "industry-match",
    sector: "Consumer Cyclical",
    industryPattern: "Apparel|Luxury",
  },
  "sector-etfs": {
    title: "Sector ETFs",
    description: "The 11 SPDR sector ETFs, with live FMP quotes.",
    category: "etf",
    source: "symbols",
    hrefBase: "/etf",
    symbols: ["XLK", "XLF", "XLE", "XLV", "XLY", "XLP", "XLI", "XLU", "XLB", "XLRE", "XLC"],
  },
  "52-week-high": {
    title: "52-Week Highs",
    description: "U.S. stocks trading closest to their 52-week high, from live FMP quotes.",
    category: "popular",
    source: "week-range",
    direction: "high",
  },
  "52-week-low": {
    title: "52-Week Lows",
    description: "U.S. stocks trading closest to their 52-week low, from live FMP quotes.",
    category: "popular",
    source: "week-range",
    direction: "low",
  },
  "dividend-aristocrats": {
    title: "Dividend Aristocrats",
    description: "S&P 500 companies known for 25+ years of dividend increases, with live FMP quotes.",
    category: "popular",
    source: "symbols",
    symbols: [
      "DOV", "GPC", "PG", "PH", "EMR", "CINF", "JNJ", "KO", "CL", "NDSN",
      "HRL", "FRT", "SWK", "MO", "SYY", "ITW", "GWW", "PPG", "TGT", "ABBV",
      "ABT", "BDX", "KMB", "LOW", "PEP", "ADM", "BF.B", "ED", "NUE", "SPGI",
      "WMT", "ADP", "APD", "MCD", "MDT", "CLX", "PNR", "SHW", "BEN", "CTAS",
      "XOM", "ATO", "AFL", "ECL", "TROW", "CVX", "MKC", "ERIE", "JKHY", "GD",
      "CB", "ROP", "AOS", "BRO", "CAT", "LIN", "WST", "ALB", "EXPD", "CHD",
      "IBM", "NEE", "SJM", "CHRW", "FAST", "CASY", "ES", "FDS",
    ],
  },
  "dividend-kings": {
    title: "Dividend Kings",
    description: "U.S. companies known for 50+ years of dividend increases, with live FMP quotes.",
    category: "popular",
    source: "symbols",
    symbols: [
      "AWR", "DOV", "NWN", "GPC", "PG", "PH", "EMR", "CINF", "JNJ", "KO",
      "CL", "NDSN", "HRL", "ABM", "CWT", "FRT", "SWK", "CBSH", "SCL", "FUL",
      "MO", "SYY", "TR", "ITW", "MSA", "NFG", "UVV", "BKH", "GWW", "PPG",
      "TGT", "ABBV", "ABT", "BDX", "KMB", "LOW", "PEP", "TNC", "ADM", "BF.B",
      "ED", "GRC", "MSEX", "NUE", "RPM", "SPGI", "TDS", "WMT", "RLI", "ADP",
      "APD", "MCD", "MGEE",
    ],
  },
  "vanguard-etfs": {
    title: "Vanguard ETFs",
    description: "The largest U.S. Vanguard ETFs, ranked by market value from the FMP screener.",
    category: "etf",
    source: "etf-issuer",
    namePattern: "vanguard",
    hrefBase: "/etf",
  },
  "ishares-etfs": {
    title: "iShares ETFs",
    description: "The largest U.S. iShares ETFs, ranked by market value from the FMP screener.",
    category: "etf",
    source: "etf-issuer",
    namePattern: "ishares",
    hrefBase: "/etf",
  },
  "spdr-etfs": {
    title: "SPDR ETFs",
    description: "The largest U.S. State Street SPDR ETFs, ranked by market value from the FMP screener.",
    category: "etf",
    source: "etf-issuer",
    namePattern: "spdr|state street",
    hrefBase: "/etf",
  },
  "invesco-etfs": {
    title: "Invesco ETFs",
    description: "The largest U.S. Invesco ETFs, ranked by market value from the FMP screener.",
    category: "etf",
    source: "etf-issuer",
    namePattern: "invesco",
    hrefBase: "/etf",
  },
  "schwab-etfs": {
    title: "Schwab ETFs",
    description: "The largest U.S. Charles Schwab ETFs, ranked by market value from the FMP screener.",
    category: "etf",
    source: "etf-issuer",
    namePattern: "schwab",
    hrefBase: "/etf",
  },
  "tsx-stocks": {
    title: "Toronto Stock Exchange",
    description: "The largest Canadian companies listed on the TSX.",
    category: "international",
    source: "screener",
    filters: { exchange: "TSX", country: "CA" },
    limit: 100,
    sort: "marketCap",
    listing: "raw",
    symbolPattern: "^[A-Z0-9]+\\.TO$",
  },
  "london-stocks": {
    title: "London Stock Exchange",
    description: "The largest U.K. companies listed on the London Stock Exchange.",
    category: "international",
    source: "screener",
    filters: { exchange: "LSE", country: "GB" },
    limit: 100,
    sort: "marketCap",
    listing: "raw",
    symbolPattern: "^[A-Z0-9]+\\.L$",
  },
  "hong-kong-stocks": {
    title: "Hong Kong Stock Exchange",
    description: "The largest companies listed on the Hong Kong Stock Exchange.",
    category: "international",
    source: "screener",
    filters: { exchange: "HKSE" },
    limit: 100,
    sort: "marketCap",
    listing: "raw",
    symbolPattern: "^\\d{4}\\.HK$",
  },
  "australia-stocks": {
    title: "Australian Securities Exchange",
    description: "The largest Australian companies listed on the ASX.",
    category: "international",
    source: "screener",
    filters: { exchange: "ASX", country: "AU" },
    limit: 100,
    sort: "marketCap",
    listing: "raw",
    symbolPattern: "^[A-Z0-9]{2,4}\\.AX$",
  },
  "germany-stocks": {
    title: "Deutsche Börse (Xetra)",
    description: "The largest German companies listed on Xetra.",
    category: "international",
    source: "screener",
    filters: { exchange: "XETRA", country: "DE" },
    limit: 100,
    sort: "marketCap",
    listing: "raw",
    symbolPattern: "^[A-Z0-9]+\\.DE$",
  },
  "japan-stocks": {
    title: "Tokyo Stock Exchange",
    description: "The largest Japanese companies listed on the Tokyo Stock Exchange.",
    category: "international",
    source: "screener",
    filters: { exchange: "JPX", country: "JP" },
    limit: 100,
    sort: "marketCap",
    listing: "raw",
    symbolPattern: "^[A-Z0-9]+\\.T$",
  },
  "india-stocks": {
    title: "National Stock Exchange of India",
    description: "The largest Indian companies listed on the NSE.",
    category: "international",
    source: "screener",
    filters: { exchange: "NSE", country: "IN" },
    limit: 100,
    sort: "marketCap",
    listing: "raw",
    symbolPattern: "^[A-Z0-9]+\\.NS$",
  },
  "france-stocks": {
    title: "Euronext Paris",
    description: "The largest French companies listed on Euronext Paris.",
    category: "international",
    source: "screener",
    filters: { exchange: "PAR", country: "FR" },
    limit: 100,
    sort: "marketCap",
    listing: "raw",
    symbolPattern: "^[A-Z0-9]+\\.PA$",
  },
  "brazil-stocks": {
    title: "B3 (Brazil)",
    description: "The largest Brazilian companies listed on B3 in São Paulo.",
    category: "international",
    source: "screener",
    filters: { exchange: "SAO", country: "BR" },
    limit: 100,
    sort: "marketCap",
    listing: "raw",
    symbolPattern: "^[A-Z0-9]+\\.SA$",
  },
  "kosdaq-stocks": {
    title: "KOSDAQ Stocks",
    description: "The largest companies listed on KOSDAQ, ranked by market cap.",
    category: "international",
    source: "screener",
    filters: { exchange: "KOE", country: "KR" },
    limit: 100,
    sort: "marketCap",
    listing: "raw",
    symbolPattern: "^[0-9]+\\.KQ$",
  },
  "bse-india": {
    title: "Bombay Stock Exchange",
    description: "The largest companies listed on the BSE in India, ranked by market cap.",
    category: "international",
    source: "screener",
    filters: { exchange: "BSE", country: "IN" },
    limit: 100,
    sort: "marketCap",
    listing: "raw",
    symbolPattern: "^[A-Z0-9]+\\.BO$",
  },
  "tsx-venture-stocks": {
    title: "TSX Venture Exchange",
    description: "The largest listings on the TSX Venture Exchange, ranked by market cap.",
    category: "international",
    source: "screener",
    filters: { exchange: "TSXV", country: "CA" },
    limit: 100,
    sort: "marketCap",
    listing: "raw",
    symbolPattern: "^[A-Z0-9]+\\.V$",
  },
  "shenzhen-stocks": {
    title: "Shenzhen Stock Exchange",
    description: "The largest companies listed in Shenzhen, ranked by market cap.",
    category: "international",
    source: "screener",
    filters: { exchange: "SHZ", country: "CN" },
    limit: 100,
    sort: "marketCap",
    listing: "raw",
    symbolPattern: "^[A-Z0-9]+\\.SZ$",
  },
} as const satisfies Record<string, StockList>;

export type StockListSlug = keyof typeof STOCK_LISTS;

export const LIST_CATEGORIES = [
  { id: "index", title: "In Index" },
  { id: "popular", title: "Popular Lists" },
  { id: "exchange", title: "U.S. Exchanges" },
  { id: "market-cap", title: "Market Cap Groups" },
  { id: "etf", title: "ETF Lists" },
  { id: "international", title: "International Exchanges" },
] as const;

export const LIST_NAV = [
  { href: "/list", label: "All Lists" },
  { href: "/list/exchanges", label: "Exchanges" },
  { href: "/list/sp-500-stocks", label: "S&P 500" },
  { href: "/list/nasdaq-100-stocks", label: "Nasdaq 100" },
  { href: "/list/dow-jones-stocks", label: "Dow Jones" },
  { href: "/list/biggest-companies", label: "Biggest" },
  { href: "/list/highest-revenue", label: "Revenue" },
  { href: "/list/highest-profit", label: "Profit" },
  { href: "/list/highest-employees", label: "Employees" },
  { href: "/list/highest-taxes", label: "Taxes" },
  { href: "/list/top-rated", label: "Top Rated" },
  { href: "/list/top-rated-dividend-stocks", label: "Top-Rated Dividends" },
  { href: "/list/oldest-companies", label: "Oldest" },
  { href: "/list/foreign-stocks", label: "Foreign" },
  { href: "/list/highest-dividend", label: "Dividends" },
  { href: "/list/dividend-aristocrats", label: "Aristocrats" },
  { href: "/list/dividend-kings", label: "Kings" },
  { href: "/list/monthly-dividend-stocks", label: "Monthly Dividends" },
  { href: "/list/penny-stocks", label: "Penny Stocks" },
  { href: "/list/high-beta-stocks", label: "High Beta" },
  { href: "/list/magnificent-seven", label: "Mag 7" },
  { href: "/list/faang", label: "FAANG" },
  { href: "/list/52-week-high", label: "52-Week High" },
  { href: "/list/52-week-low", label: "52-Week Low" },
  { href: "/list/mega-cap-stocks", label: "Mega Cap" },
  { href: "/list/reit-stocks", label: "REITs" },
  { href: "/list/airline-stocks", label: "Airlines" },
  { href: "/list/gold-stocks", label: "Gold" },
  { href: "/list/restaurant-stocks", label: "Restaurants" },
  { href: "/list/retail-stocks", label: "Retail" },
  { href: "/list/ev-stocks", label: "EVs" },
  { href: "/list/ai-stocks", label: "AI" },
  { href: "/list/cloud-stocks", label: "Cloud" },
  { href: "/list/healthcare-stocks", label: "Healthcare" },
  { href: "/list/glp1-stocks", label: "GLP-1" },
  { href: "/list/apparel-stocks", label: "Apparel" },
  { href: "/list/chemical-stocks", label: "Chemicals" },
  { href: "/list/waste-management-stocks", label: "Waste" },
  { href: "/list/bdc-stocks", label: "BDCs" },
  { href: "/list/cef-funds", label: "CEFs" },
  { href: "/list/preferred-stocks", label: "Preferred" },
  { href: "/list/solar-stocks", label: "Solar" },
  { href: "/list/cybersecurity-stocks", label: "Cyber" },
  { href: "/list/fintech-stocks", label: "Fintech" },
  { href: "/list/streaming-stocks", label: "Streaming" },
  { href: "/list/bond-etfs", label: "Bond ETFs" },
  { href: "/list/semiconductor-stocks", label: "Chips" },
  { href: "/list/highest-volume", label: "Volume" },
  { href: "/list/dividend-etfs", label: "Dividend ETFs" },
];

export function listHrefBase(slug: StockListSlug) {
  const list = STOCK_LISTS[slug];
  return "hrefBase" in list && list.hrefBase ? list.hrefBase : "/stocks";
}

export function isStockListSlug(value: string): value is StockListSlug {
  return value in STOCK_LISTS;
}

/** Stock Analysis slugs that map onto lists we already publish under a different path. */
export const LIST_SLUG_ALIASES: Record<string, StockListSlug> = {
  "most-employees": "highest-employees",
  "most-taxes-us": "highest-taxes",
  "car-company-stocks": "auto-stocks",
  "pharmaceutical-stocks": "pharma-stocks",
  pharma: "pharma-stocks",
  "oil-gas": "oil-gas-stocks",
  oil: "oil-gas-stocks",
  utilities: "utilities-stocks",
  "mega-cap": "mega-cap-stocks",
  "large-cap": "large-cap-stocks",
  "mid-cap": "mid-cap-stocks",
  "small-cap": "small-cap-stocks",
  "micro-cap": "micro-cap-stocks",
  tsx: "tsx-stocks",
  canada: "tsx-stocks",
  "uk-stocks": "london-stocks",
  uk: "london-stocks",
  london: "london-stocks",
  streaming: "streaming-stocks",
  autos: "auto-stocks",
  cars: "auto-stocks",
  semis: "semiconductor-stocks",
  biotech: "biotech-stocks",
  sp500: "sp-500-stocks",
  nasdaq100: "nasdaq-100-stocks",
  dow: "dow-jones-stocks",
  biggest: "biggest-companies",
  "most-valuable": "biggest-companies",
  asx: "australia-stocks",
  hk: "hong-kong-stocks",
  nikkei: "japan-stocks",
  insurance: "insurance-stocks",
  shipping: "shipping-stocks",
  tobacco: "tobacco-stocks",
  casinos: "casino-stocks",
  beverages: "beverage-stocks",
  steel: "steel-stocks",
  uranium: "uranium-stocks",
  "social-media": "social-media-stocks",
  "video-games": "video-game-stocks",
  internet: "internet-stocks",
  advertising: "advertising-stocks",
  penny: "penny-stocks",
  "high-beta": "high-beta-stocks",
  "52-week-lows": "52-week-low",
  "52-week-highs": "52-week-high",
  aristocrats: "dividend-aristocrats",
  kings: "dividend-kings",
  mag7: "magnificent-seven",
  "mag-7": "magnificent-seven",
  nyse: "nyse-stocks",
  nasdaq: "nasdaq-stocks",
  otc: "otc-stocks",
  oldest: "oldest-companies",
  foreign: "foreign-stocks",
  "monthly-dividends": "monthly-dividend-stocks",
  leveraged: "leveraged-etfs",
  "bond-etf": "bond-etfs",
  "crypto-etf": "crypto-etfs",
  "dividend-etf": "dividend-etfs",
  banks: "bank-stocks",
  reits: "reit-stocks",
  airlines: "airline-stocks",
  restaurants: "restaurant-stocks",
  nyseamerican: "nyse-american-stocks",
  "nyseamerican-stocks": "nyse-american-stocks",
  "nyse-american": "nyse-american-stocks",
  "business-development-companies": "bdc-stocks",
  "electric-vehicles": "ev-stocks",
  "gaming-stocks": "video-game-stocks",
  "covered-call-etfs": "income-etfs",
  "fixed-income-etfs": "bond-etfs",
  "monthly-dividend-etfs": "dividend-etfs",
  "weekly-dividend-etfs": "dividend-etfs",
  "london-stock-exchange": "london-stocks",
  "toronto-stock-exchange": "tsx-stocks",
  "tokyo-stock-exchange": "japan-stocks",
  "hong-kong-stock-exchange": "hong-kong-stocks",
  "australian-securities-exchange": "australia-stocks",
  "deutsche-boerse-xetra": "germany-stocks",
  "euronext-paris": "france-stocks",
  "nse-india": "india-stocks",
  "brazil-stock-exchange": "brazil-stocks",
  "tsx-venture-exchange": "tsx-venture-stocks",
  "kosdaq-korea": "kosdaq-stocks",
  "shenzhen-stock-exchange": "shenzhen-stocks",
};

/** Stock Analysis list URLs that resolve to a country page, funds hub, or exchanges directory. */
export const LIST_PATH_ALIASES: Record<string, string> = {
  exchanges: "/list/exchanges",
  "mutual-funds": "/funds",
  "six-swiss-exchange": "/stocks/country/ch",
  "korea-stock-exchange": "/stocks/country/kr",
  "taiwan-stock-exchange": "/stocks/country/tw",
  "singapore-exchange": "/stocks/country/sg",
  "mexican-stock-exchange": "/stocks/country/mx",
  "new-zealand-stock-exchange": "/stocks/country/nz",
  "tel-aviv-stock-exchange": "/stocks/country/il",
  "johannesburg-stock-exchange": "/stocks/country/za",
  "nasdaq-stockholm": "/stocks/country/se",
  "copenhagen-stock-exchange": "/stocks/country/dk",
  "oslo-bors": "/stocks/country/no",
  "warsaw-stock-exchange": "/stocks/country/pl",
  "euronext-brussels": "/stocks/country/be",
  "nasdaq-helsinki": "/stocks/country/fi",
  "vienna-stock-exchange": "/stocks/country/at",
  "euronext-amsterdam": "/stocks/country/nl",
  "madrid-stock-exchange": "/stocks/country/es",
  "borsa-italiana": "/stocks/country/it",
  "euronext-dublin": "/stocks/country/ie",
  "euronext-lisbon": "/stocks/country/pt",
  "athens-stock-exchange": "/stocks/country/gr",
  "prague-stock-exchange": "/stocks/country/cz",
  "nasdaq-iceland": "/stocks/country/is",
  "borsa-istanbul": "/stocks/country/tr",
  "buenos-aires-stock-exchange": "/stocks/country/ar",
  "santiago-stock-exchange": "/stocks/country/cl",
  "shanghai-stock-exchange": "/stocks/country/cn",
  "indonesia-stock-exchange": "/stocks/country/id",
  "bursa-malaysia": "/stocks/country/my",
  "stock-exchange-of-thailand": "/stocks/country/th",
  "saudi-stock-exchange": "/stocks/country/sa",
  "dubai-financial-market": "/stocks/country/ae",
  "qatar-stock-exchange": "/stocks/country/qa",
};

export function resolveStockListSlug(value: string): StockListSlug | null {
  if (isStockListSlug(value)) return value;
  return LIST_SLUG_ALIASES[value] ?? null;
}

export function resolveListPath(value: string): string | null {
  if (LIST_PATH_ALIASES[value]) return LIST_PATH_ALIASES[value];
  const slug = resolveStockListSlug(value);
  return slug && slug !== value ? `/list/${slug}` : null;
}

export type IndexMemberFilters = {
  sector?: string;
  industry?: string;
  exchange?: string;
  minCap?: number;
  maxCap?: number;
  minPrice?: number;
  maxPrice?: number;
  minVolume?: number;
};

export async function loadIndexMembers(
  index: FmpIndexKey,
  filters: IndexMemberFilters = {},
): Promise<{ rows: SymbolTableRow[]; sectors: string[]; industries: string[] }> {
  const constituents = await getIndexConstituents(index);
  const quotes = await getQuotes(constituents.map((row) => row.symbol));
  const bySymbol = new Map(quotes.map((quote) => [quote.symbol, quote]));
  const sectors = [...new Set(constituents.map((row) => row.sector).filter(Boolean))].sort((a, b) => a.localeCompare(b));
  const industries = [...new Set(constituents.map((row) => row.subSector).filter(Boolean))].sort((a, b) =>
    a.localeCompare(b),
  );
  const exchangeNeedle = filters.exchange?.toUpperCase();
  const rows: SymbolTableRow[] = [];
  for (const row of constituents) {
    if (filters.sector && row.sector !== filters.sector) continue;
    if (filters.industry && row.subSector !== filters.industry) continue;
    const quote = bySymbol.get(row.symbol);
    const price = quote?.price ?? null;
    const marketCap = quote?.marketCap ?? null;
    const volume = quote?.volume ?? null;
    const exchange = quote?.exchange ?? null;
    if (filters.minCap != null && (marketCap ?? 0) < filters.minCap) continue;
    if (filters.maxCap != null && (marketCap ?? 0) > filters.maxCap) continue;
    if (filters.minPrice != null && (price ?? 0) < filters.minPrice) continue;
    if (filters.maxPrice != null && (price == null || price > filters.maxPrice)) continue;
    if (filters.minVolume != null && (volume ?? 0) < filters.minVolume) continue;
    if (exchangeNeedle && !(exchange ?? "").toUpperCase().includes(exchangeNeedle)) continue;
    rows.push({
      symbol: row.symbol,
      name: row.name,
      industry: row.subSector || row.sector,
      marketCap,
      price,
      changePercentage: quote?.changePercentage ?? null,
      volume,
      exchange,
    });
  }
  rows.sort((a, b) => (b.marketCap ?? 0) - (a.marketCap ?? 0));
  return { rows, sectors, industries };
}

export async function loadStockList(slug: StockListSlug): Promise<SymbolTableRow[]> {
  const list = STOCK_LISTS[slug];

  if (list.source === "constituents") {
    const { rows } = await loadIndexMembers(list.index);
    return rows;
  }

  if (list.source === "monthly-dividends") {
    return loadMonthlyDividendStocks();
  }

  if (list.source === "symbols") {
    const rows = await loadSymbolsList(list.symbols);
    if (slug === "preferred-stocks") {
      return rows.map((row) => ({
        ...row,
        name: /preferred/i.test(row.name) ? row.name : `${row.name} Preferred`,
      }));
    }
    return rows;
  }

  if (list.source === "week-range") {
    return loadWeekRangeList(list.direction);
  }

  if (list.source === "industry-match") {
    return loadIndustryMatchList(list.sector, list.industryPattern);
  }

  if (list.source === "fundamentals-rank") {
    return loadFundamentalsRank(list.rank);
  }

  if (list.source === "ratings-rank") {
    return loadRatingsRank("dividendOnly" in list && list.dividendOnly === true);
  }

  if (list.source === "etf-issuer") {
    return loadEtfIssuerList(list.namePattern);
  }

  if (list.source === "oldest") {
    return loadOldestSp500();
  }

  if (list.source === "otc") {
    return loadOtcStocks();
  }

  if (list.source === "foreign-us") {
    return loadForeignUsStocks("originCountry" in list ? list.originCountry : undefined);
  }

  const listing = "listing" in list && list.listing === "raw" ? "raw" : "primary";
  const yieldMax = "yieldMax" in list ? list.yieldMax : undefined;
  const symbolPattern =
    "symbolPattern" in list && typeof list.symbolPattern === "string" ? new RegExp(list.symbolPattern, "i") : null;
  const raw = await getScreener({ ...list.filters }, { limit: list.limit });
  let selected = listing === "raw" ? uniqueBySymbol(raw) : preferPrimaryListings(raw);
  if (listing !== "raw") {
    selected = selected.filter((row) => row.isActivelyTrading !== false);
  }
  if (symbolPattern) {
    selected = selected.filter((row) => symbolPattern.test(row.symbol));
  }
  const namePattern =
    "namePattern" in list && typeof list.namePattern === "string" ? new RegExp(list.namePattern, "i") : null;
  if (namePattern) {
    selected = selected.filter((row) => namePattern.test(row.companyName || ""));
  }
  let rows = await toScreenerRows(selected);
  const capMax = "capMax" in list && typeof list.capMax === "number" ? list.capMax : undefined;
  if (capMax != null) {
    rows = rows.filter((row) => (row.marketCap ?? 0) > 0 && (row.marketCap ?? 0) < capMax);
  }
  if (yieldMax != null) {
    rows = rows.filter((row) => (row.dividendYield ?? 0) > 0 && (row.dividendYield ?? 0) < yieldMax);
  }

  if (list.sort === "dividendYield") {
    return rows.sort((a, b) => (b.dividendYield ?? 0) - (a.dividendYield ?? 0)).slice(0, 50);
  }
  if (list.sort === "volume") {
    return rows.sort((a, b) => (b.volume ?? 0) - (a.volume ?? 0)).slice(0, 100);
  }
  return rows.sort((a, b) => (b.marketCap ?? 0) - (a.marketCap ?? 0)).slice(0, 100);
}

async function toScreenerRows(raw: FmpScreenerRow[]): Promise<SymbolTableRow[]> {
  const quotes = await getQuotes(raw.map((row) => row.symbol));
  const bySymbol = new Map(quotes.map((quote) => [quote.symbol, quote]));
  return raw.map((row) => {
    const quote = bySymbol.get(row.symbol);
    const price = quote?.price ?? row.price;
    const dividend = row.lastAnnualDividend;
    const dividendYield = price && dividend ? dividend / price : 0;
    return {
      symbol: row.symbol,
      name: row.companyName,
      marketCap: quote?.marketCap ?? row.marketCap,
      price,
      changePercentage: quote?.changePercentage,
      industry: row.industry,
      country: row.country,
      exchange: row.exchangeShortName || row.exchange,
      volume: quote?.volume ?? row.volume,
      dividendYield,
    };
  });
}

async function loadSymbolsList(symbols: readonly string[]): Promise<SymbolTableRow[]> {
  const [quotes, screener] = await Promise.all([
    getQuotes([...symbols]),
    getScreener({ country: "US" }, { limit: 1000 }),
  ]);
  const bySymbol = new Map(quotes.map((quote) => [quote.symbol, quote]));
  const meta = new Map(screener.map((row) => [row.symbol, row]));
  const missing = symbols.filter((symbol) => !meta.has(symbol)).slice(0, 15);
  const profiles = await Promise.all(missing.map((symbol) => getProfile(symbol)));
  const profileBySymbol = new Map(
    profiles.filter((row): row is NonNullable<typeof row> => Boolean(row?.symbol)).map((row) => [row.symbol, row]),
  );
  return symbols
    .map((symbol) => {
      const quote = bySymbol.get(symbol);
      const row = meta.get(symbol);
      const profile = profileBySymbol.get(symbol);
      const price = quote?.price ?? row?.price ?? profile?.price ?? null;
      const dividend = row?.lastAnnualDividend ?? profile?.lastDividend;
      return {
        symbol,
        name: quote?.name || row?.companyName || profile?.companyName || symbol,
        industry: row?.industry || profile?.industry,
        marketCap: quote?.marketCap ?? row?.marketCap ?? profile?.marketCap ?? null,
        price,
        changePercentage: quote?.changePercentage ?? profile?.changePercentage ?? null,
        volume: quote?.volume ?? row?.volume ?? profile?.volume ?? null,
        dividendYield: price && dividend ? dividend / price : null,
        country: row?.country || profile?.country,
      };
    })
    .sort((a, b) => (b.marketCap ?? 0) - (a.marketCap ?? 0));
}

async function loadWeekRangeList(direction: "high" | "low"): Promise<SymbolTableRow[]> {
  const raw = await getScreener(
    { country: "US", marketCapMoreThan: 1_000_000_000, volumeMoreThan: 200_000 },
    { limit: 200 },
  );
  const selected = preferPrimaryListings(raw);
  const quotes = await getQuotes(selected.map((row) => row.symbol));
  const bySymbol = new Map(quotes.map((quote) => [quote.symbol, quote]));
  const scored = selected.flatMap((row) => {
    const quote = bySymbol.get(row.symbol);
    const price = quote?.price ?? row.price;
    const yearHigh = quote?.yearHigh;
    const yearLow = quote?.yearLow;
    if (!price || price <= 0) return [];
    const proximity =
      direction === "high"
        ? yearHigh && yearHigh > 0
          ? price / yearHigh
          : null
        : yearLow && yearLow > 0
          ? price / yearLow
          : null;
    if (proximity == null) return [];
    if (direction === "high" && proximity < 0.97) return [];
    if (direction === "low" && (price <= 1 || proximity > 1.08)) return [];
    const dividend = row.lastAnnualDividend;
    return [
      {
        proximity,
        row: {
          symbol: row.symbol,
          name: row.companyName,
          industry: row.industry,
          marketCap: quote?.marketCap ?? row.marketCap,
          price,
          changePercentage: quote?.changePercentage,
          volume: quote?.volume ?? row.volume,
          dividendYield: dividend ? dividend / price : null,
        } satisfies SymbolTableRow,
      },
    ];
  });
  scored.sort((a, b) => (direction === "high" ? b.proximity - a.proximity : a.proximity - b.proximity));
  return scored.slice(0, 100).map((item) => item.row);
}

const MEGA_US_FUNDAMENTALS = [
  "WMT", "AMZN", "AAPL", "UNH", "XOM", "BRK.B", "CVS", "GOOGL", "MCK", "COST",
  "MSFT", "CI", "F", "GM", "ELV", "JPM", "BAC", "CVX", "HD", "T",
  "VZ", "META", "TSLA", "PFE", "JNJ", "WFC", "C", "KR", "TGT", "PEP",
  "KO", "IBM", "GE", "BA", "LLY", "ABBV", "MRK", "UPS", "FDX", "DIS",
] as const;

async function loadFundamentalsRank(rank: "revenue" | "employees" | "tax" | "profit"): Promise<SymbolTableRow[]> {
  const [quotes, statements, profiles] = await Promise.all([
    getQuotes([...MEGA_US_FUNDAMENTALS]),
    Promise.all(MEGA_US_FUNDAMENTALS.map((symbol) => getIncomeTtm(symbol))),
    Promise.all(MEGA_US_FUNDAMENTALS.map((symbol) => getProfile(symbol))),
  ]);
  const quoteBy = new Map(quotes.map((quote) => [quote.symbol, quote]));
  const rows = MEGA_US_FUNDAMENTALS.map((symbol, index) => {
    const quote = quoteBy.get(symbol);
    const ttm = statements[index];
    const profile = profiles[index];
    const employees = profile?.fullTimeEmployees ? Number(profile.fullTimeEmployees) : null;
    return {
      symbol,
      name: quote?.name || profile?.companyName || symbol,
      industry: profile?.industry,
      marketCap: quote?.marketCap ?? profile?.marketCap ?? null,
      price: quote?.price ?? profile?.price ?? null,
      changePercentage: quote?.changePercentage ?? profile?.changePercentage ?? null,
      volume: quote?.volume ?? profile?.volume ?? null,
      revenue: ttm?.revenue ?? null,
      employees: Number.isFinite(employees) ? employees : null,
      incomeTax: ttm?.incomeTaxExpense ?? null,
      netIncome: ttm?.netIncome ?? null,
    } satisfies SymbolTableRow;
  });
  const key =
    rank === "revenue"
      ? "revenue"
      : rank === "employees"
        ? "employees"
        : rank === "tax"
          ? "incomeTax"
          : "netIncome";
  return rows
    .filter((row) => (row[key] ?? 0) > 0)
    .sort((a, b) => (b[key] ?? 0) - (a[key] ?? 0));
}

const RATING_LETTER_ORDER = ["A+", "A", "A-", "B+", "B", "B-", "C+", "C", "C-", "D", "E", "F"];

async function loadRatingsRank(dividendOnly = false): Promise<SymbolTableRow[]> {
  const [quotes, ratings, screener] = await Promise.all([
    getQuotes([...MEGA_US_FUNDAMENTALS]),
    Promise.all(MEGA_US_FUNDAMENTALS.map((symbol) => getRatings(symbol))),
    dividendOnly ? getScreener({ country: "US" }, { limit: 1000 }) : Promise.resolve([] as FmpScreenerRow[]),
  ]);
  const quoteBy = new Map(quotes.map((quote) => [quote.symbol, quote]));
  const yieldBy = new Map(
    screener.map((row) => {
      const price = row.price;
      const dividend = row.lastAnnualDividend;
      const yieldPct = price && dividend ? dividend / price : 0;
      return [row.symbol.toUpperCase(), yieldPct] as const;
    }),
  );
  const letterRank = (rating?: string | null) => {
    const index = RATING_LETTER_ORDER.indexOf((rating || "").toUpperCase());
    return index === -1 ? 99 : index;
  };
  const rows = MEGA_US_FUNDAMENTALS.map((symbol, index) => {
    const quote = quoteBy.get(symbol);
    const rating = ratings[index];
    return {
      symbol,
      name: quote?.name || symbol,
      marketCap: quote?.marketCap ?? null,
      price: quote?.price ?? null,
      changePercentage: quote?.changePercentage ?? null,
      volume: quote?.volume ?? null,
      rating: rating?.rating ?? null,
      ratingScore: rating?.overallScore ?? null,
      dividendYield: yieldBy.get(symbol) ?? null,
    } satisfies SymbolTableRow;
  });
  return rows
    .filter((row) => row.ratingScore != null || Boolean(row.rating))
    .filter((row) => !dividendOnly || (row.dividendYield ?? 0) >= 0.01)
    .sort(
      (a, b) =>
        (b.ratingScore ?? 0) - (a.ratingScore ?? 0) ||
        letterRank(a.rating) - letterRank(b.rating) ||
        (b.dividendYield ?? 0) - (a.dividendYield ?? 0) ||
        (b.marketCap ?? 0) - (a.marketCap ?? 0),
    );
}

async function loadIndustryMatchList(sector: string | undefined, industryPattern: string): Promise<SymbolTableRow[]> {
  const matcher = new RegExp(industryPattern, "i");
  const raw = await getScreenerPages({ country: "US", ...(sector ? { sector } : {}) }, { pages: 1, limit: 1000, revalidate: 1800 });
  const selected = preferPrimaryListings(raw)
    .filter((row) => matcher.test(row.industry || ""))
    .filter((row) => row.isActivelyTrading !== false);
  const rows = await toScreenerRows(selected);
  return rows
    .filter((row) => (row.marketCap ?? 0) >= 50_000_000)
    .sort((a, b) => (b.marketCap ?? 0) - (a.marketCap ?? 0))
    .slice(0, 100);
}

async function loadEtfIssuerList(namePattern: string): Promise<SymbolTableRow[]> {
  const matcher = new RegExp(namePattern, "i");
  const raw = await getScreener({ isEtf: true, isFund: false, country: "US" }, { limit: 200 });
  const selected = preferPrimaryListings(raw).filter((row) => matcher.test(row.companyName || ""));
  const rows = await toScreenerRows(selected);
  return rows
    .filter((row) => (row.marketCap ?? 0) > 0)
    .sort((a, b) => (b.marketCap ?? 0) - (a.marketCap ?? 0))
    .slice(0, 50);
}

async function loadOldestSp500(): Promise<SymbolTableRow[]> {
  const constituents = await getIndexConstituents("sp500");
  const ranked = constituents
    .map((row) => ({ ...row, foundedYear: parseFoundedYear(row.founded) }))
    .filter((row): row is typeof row & { foundedYear: number } => row.foundedYear != null)
    .sort((a, b) => a.foundedYear - b.foundedYear || a.symbol.localeCompare(b.symbol))
    .slice(0, 100);
  const quotes = await getQuotes(ranked.map((row) => row.symbol));
  const bySymbol = new Map(quotes.map((quote) => [quote.symbol, quote]));
  return ranked.map((row) => {
    const quote = bySymbol.get(row.symbol);
    return {
      symbol: row.symbol,
      name: row.name,
      industry: row.subSector || row.sector,
      founded: row.foundedYear,
      marketCap: quote?.marketCap ?? null,
      price: quote?.price ?? null,
      changePercentage: quote?.changePercentage ?? null,
      volume: quote?.volume ?? null,
    };
  });
}

async function loadOtcStocks(): Promise<SymbolTableRow[]> {
  const raw = await getScreener({ exchange: "OTC", country: "US" }, { limit: 200 });
  const cleaned = uniqueBySymbol(
    raw.filter((row) => {
      if (isForeignListingSymbol(row.symbol)) return false;
      const cap = row.marketCap ?? 0;
      return cap > 0 && cap < 200_000_000_000;
    }),
  );
  const rows = await toScreenerRows(cleaned);
  return rows.sort((a, b) => (b.marketCap ?? 0) - (a.marketCap ?? 0)).slice(0, 100);
}

async function loadForeignUsStocks(originCountry?: string): Promise<SymbolTableRow[]> {
  const batches = await Promise.all([
    getScreener({ exchange: "NYSE" }, { limit: 100 }),
    getScreener({ exchange: "NASDAQ" }, { limit: 100 }),
    getScreener({ exchange: "AMEX" }, { limit: 100 }),
  ]);
  const origin = originCountry?.toUpperCase();
  const foreign = uniqueBySymbol(
    batches.flat().filter((row) => {
      if (!row.country || row.country.toUpperCase() === "US") return false;
      if (origin && row.country.toUpperCase() !== origin) return false;
      if (isForeignListingSymbol(row.symbol)) return false;
      return (row.marketCap ?? 0) > 0;
    }),
  );
  const rows = await toScreenerRows(foreign);
  return rows.sort((a, b) => (b.marketCap ?? 0) - (a.marketCap ?? 0)).slice(0, 100);
}

async function loadMonthlyDividendStocks(): Promise<SymbolTableRow[]> {
  const today = nyDateString();
  const from = isoDate(addDays(new Date(`${today}T00:00:00Z`), -7));
  const to = isoDate(addDays(new Date(`${today}T00:00:00Z`), 45));
  const calendar = await getDividendCalendar(from, to);
  const monthly = uniqueBySymbol(
    calendar.filter((row) => /month/i.test(row.frequency || "") && !isForeignListingSymbol(row.symbol)),
  );
  const quotes = await getQuotes(monthly.map((row) => row.symbol));
  const bySymbol = new Map(quotes.map((quote) => [quote.symbol, quote]));
  return monthly
    .map((row) => {
      const quote = bySymbol.get(row.symbol);
      const price = quote?.price ?? null;
      const payments = annualDividendPayments(row.frequency);
      const dividendYield = price && row.dividend ? (row.dividend * payments) / price : null;
      return {
        symbol: row.symbol,
        name: quote?.name || row.symbol,
        marketCap: quote?.marketCap ?? null,
        price,
        changePercentage: quote?.changePercentage ?? null,
        volume: quote?.volume ?? null,
        dividendYield,
      };
    })
    .filter((row) => row.price && row.price > 0 && (row.dividendYield ?? 0) > 0 && (row.dividendYield ?? 0) < 0.4)
    .sort((a, b) => (b.dividendYield ?? 0) - (a.dividendYield ?? 0))
    .slice(0, 100);
}
