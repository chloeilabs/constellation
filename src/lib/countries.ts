import { cache } from "react";
import { getScreener, withQuoteChanges } from "@/lib/fmp";
import { uniqueBySymbol } from "@/lib/listings";

export type CountryRegion = "americas" | "europe" | "asia-pacific" | "other";

export type CountryMarket = {
  code: string;
  name: string;
  region: CountryRegion;
  exchangeName: string;
  currency: string;
  country?: string;
  exchange?: string;
  symbolPattern?: string;
  listSlug?: string;
};

export const COUNTRY_REGIONS: { id: CountryRegion; title: string }[] = [
  { id: "americas", title: "Americas" },
  { id: "europe", title: "Europe" },
  { id: "asia-pacific", title: "Asia-Pacific" },
  { id: "other", title: "Middle East & Africa" },
];

export const COUNTRY_MARKETS: CountryMarket[] = [
  {
    code: "us",
    name: "United States",
    region: "americas",
    exchangeName: "NYSE / Nasdaq",
    currency: "USD",
    country: "US",
  },
  {
    code: "ca",
    name: "Canada",
    region: "americas",
    exchangeName: "Toronto Stock Exchange",
    currency: "CAD",
    country: "CA",
    exchange: "TSX",
    symbolPattern: "^[A-Z0-9]+\\.TO$",
    listSlug: "tsx-stocks",
  },
  {
    code: "mx",
    name: "Mexico",
    region: "americas",
    exchangeName: "Mexican Stock Exchange",
    currency: "MXN",
    country: "MX",
    exchange: "MEX",
    symbolPattern: "^[A-Z0-9&-]+\\.MX$",
    listSlug: "mexico-stocks",
  },
  {
    code: "br",
    name: "Brazil",
    region: "americas",
    exchangeName: "B3 (São Paulo)",
    currency: "BRL",
    country: "BR",
    exchange: "SAO",
    symbolPattern: "^[A-Z0-9]+\\.SA$",
    listSlug: "brazil-stocks",
  },
  {
    code: "gb",
    name: "United Kingdom",
    region: "europe",
    exchangeName: "London Stock Exchange",
    currency: "GBP",
    country: "GB",
    exchange: "LSE",
    symbolPattern: "^[A-Z0-9]+\\.L$",
    listSlug: "london-stocks",
  },
  {
    code: "de",
    name: "Germany",
    region: "europe",
    exchangeName: "Deutsche Börse (Xetra)",
    currency: "EUR",
    country: "DE",
    exchange: "XETRA",
    symbolPattern: "^[A-Z0-9]+\\.DE$",
    listSlug: "germany-stocks",
  },
  {
    code: "fr",
    name: "France",
    region: "europe",
    exchangeName: "Euronext Paris",
    currency: "EUR",
    country: "FR",
    exchange: "PAR",
    symbolPattern: "^[A-Z0-9]+\\.PA$",
    listSlug: "france-stocks",
  },
  {
    code: "ch",
    name: "Switzerland",
    region: "europe",
    exchangeName: "SIX Swiss Exchange",
    currency: "CHF",
    country: "CH",
    exchange: "SIX",
    symbolPattern: "^[A-Z0-9]+\\.SW$",
    listSlug: "swiss-stocks",
  },
  {
    code: "nl",
    name: "Netherlands",
    region: "europe",
    exchangeName: "Euronext Amsterdam",
    currency: "EUR",
    country: "NL",
    exchange: "AMS",
    symbolPattern: "^[A-Z0-9]+\\.AS$",
    listSlug: "amsterdam-stocks",
  },
  {
    code: "it",
    name: "Italy",
    region: "europe",
    exchangeName: "Borsa Italiana",
    currency: "EUR",
    country: "IT",
    exchange: "MIL",
    symbolPattern: "^[A-Z0-9]+\\.MI$",
    listSlug: "italy-stocks",
  },
  {
    code: "es",
    name: "Spain",
    region: "europe",
    exchangeName: "Bolsa de Madrid",
    currency: "EUR",
    country: "ES",
    exchange: "BME",
    symbolPattern: "^[A-Z0-9]+\\.MC$",
    listSlug: "spain-stocks",
  },
  {
    code: "se",
    name: "Sweden",
    region: "europe",
    exchangeName: "Nasdaq Stockholm",
    currency: "SEK",
    country: "SE",
    exchange: "STO",
    symbolPattern: "^[A-Z0-9-]+\\.ST$",
    listSlug: "sweden-stocks",
  },
  {
    code: "dk",
    name: "Denmark",
    region: "europe",
    exchangeName: "Nasdaq Copenhagen",
    currency: "DKK",
    country: "DK",
    exchange: "CPH",
    symbolPattern: "^[A-Z0-9-]+\\.CO$",
    listSlug: "denmark-stocks",
  },
  {
    code: "no",
    name: "Norway",
    region: "europe",
    exchangeName: "Oslo Børs",
    currency: "NOK",
    country: "NO",
    exchange: "OSL",
    symbolPattern: "^[A-Z0-9]+\\.OL$",
    listSlug: "norway-stocks",
  },
  {
    code: "pl",
    name: "Poland",
    region: "europe",
    exchangeName: "Warsaw Stock Exchange",
    currency: "PLN",
    country: "PL",
    exchange: "WSE",
    symbolPattern: "^[A-Z0-9]+\\.WA$",
    listSlug: "poland-stocks",
  },
  {
    code: "be",
    name: "Belgium",
    region: "europe",
    exchangeName: "Euronext Brussels",
    currency: "EUR",
    country: "BE",
    exchange: "BRU",
    symbolPattern: "^[A-Z0-9]+\\.BR$",
    listSlug: "belgium-stocks",
  },
  {
    code: "fi",
    name: "Finland",
    region: "europe",
    exchangeName: "Nasdaq Helsinki",
    currency: "EUR",
    country: "FI",
    exchange: "HEL",
    symbolPattern: "^[A-Z0-9-]+\\.HE$",
    listSlug: "finland-stocks",
  },
  {
    code: "at",
    name: "Austria",
    region: "europe",
    exchangeName: "Wiener Börse",
    currency: "EUR",
    country: "AT",
    exchange: "VIE",
    symbolPattern: "^[A-Z0-9]+\\.VI$",
    listSlug: "austria-stocks",
  },
  {
    code: "jp",
    name: "Japan",
    region: "asia-pacific",
    exchangeName: "Tokyo Stock Exchange",
    currency: "JPY",
    country: "JP",
    exchange: "JPX",
    symbolPattern: "^[A-Z0-9]+\\.T$",
    listSlug: "japan-stocks",
  },
  {
    code: "kr",
    name: "South Korea",
    region: "asia-pacific",
    exchangeName: "Korea Exchange",
    currency: "KRW",
    country: "KR",
    exchange: "KSC",
    symbolPattern: "^[0-9]+\\.KS$",
    listSlug: "korea-stocks",
  },
  {
    code: "tw",
    name: "Taiwan",
    region: "asia-pacific",
    exchangeName: "Taiwan Stock Exchange",
    currency: "TWD",
    country: "TW",
    exchange: "TAI",
    symbolPattern: "^[0-9]+\\.TW$",
    listSlug: "taiwan-stocks",
  },
  {
    code: "hk",
    name: "Hong Kong",
    region: "asia-pacific",
    exchangeName: "Hong Kong Stock Exchange",
    currency: "HKD",
    exchange: "HKSE",
    symbolPattern: "^\\d{4}\\.HK$",
    listSlug: "hong-kong-stocks",
  },
  {
    code: "sg",
    name: "Singapore",
    region: "asia-pacific",
    exchangeName: "Singapore Exchange",
    currency: "SGD",
    country: "SG",
    exchange: "SES",
    symbolPattern: "^[A-Z0-9]+\\.SI$",
    listSlug: "singapore-stocks",
  },
  {
    code: "au",
    name: "Australia",
    region: "asia-pacific",
    exchangeName: "Australian Securities Exchange",
    currency: "AUD",
    country: "AU",
    exchange: "ASX",
    symbolPattern: "^[A-Z0-9]{2,4}\\.AX$",
    listSlug: "australia-stocks",
  },
  {
    code: "in",
    name: "India",
    region: "asia-pacific",
    exchangeName: "National Stock Exchange",
    currency: "INR",
    country: "IN",
    exchange: "NSE",
    symbolPattern: "^[A-Z0-9]+\\.NS$",
    listSlug: "india-stocks",
  },
  {
    code: "nz",
    name: "New Zealand",
    region: "asia-pacific",
    exchangeName: "NZX",
    currency: "NZD",
    country: "NZ",
    exchange: "NZE",
    symbolPattern: "^[A-Z0-9]+\\.NZ$",
    listSlug: "new-zealand-stocks",
  },
  {
    code: "il",
    name: "Israel",
    region: "other",
    exchangeName: "Tel Aviv Stock Exchange",
    currency: "ILS",
    country: "IL",
    exchange: "TLV",
    symbolPattern: "^[A-Z0-9]+\\.TA$",
    listSlug: "israel-stocks",
  },
  {
    code: "za",
    name: "South Africa",
    region: "other",
    exchangeName: "Johannesburg Stock Exchange",
    currency: "ZAR",
    country: "ZA",
    exchange: "JNB",
    symbolPattern: "^[A-Z0-9]+\\.JO$",
    listSlug: "south-africa-stocks",
  },
  {
    code: "ie",
    name: "Ireland",
    region: "europe",
    exchangeName: "Euronext Dublin",
    currency: "EUR",
    country: "IE",
    exchange: "DUB",
    symbolPattern: "^[A-Z0-9]+\\.IR$",
  },
  {
    code: "pt",
    name: "Portugal",
    region: "europe",
    exchangeName: "Euronext Lisbon",
    currency: "EUR",
    country: "PT",
    exchange: "LIS",
    symbolPattern: "^[A-Z0-9]+\\.LS$",
    listSlug: "portugal-stocks",
  },
  {
    code: "gr",
    name: "Greece",
    region: "europe",
    exchangeName: "Athens Stock Exchange",
    currency: "EUR",
    country: "GR",
    exchange: "ATH",
    symbolPattern: "^[A-Z0-9]+\\.AT$",
    listSlug: "greece-stocks",
  },
  {
    code: "cz",
    name: "Czech Republic",
    region: "europe",
    exchangeName: "Prague Stock Exchange",
    currency: "CZK",
    country: "CZ",
    exchange: "PRA",
    symbolPattern: "^[A-Z0-9]+\\.PR$",
  },
  {
    code: "is",
    name: "Iceland",
    region: "europe",
    exchangeName: "Nasdaq Iceland",
    currency: "ISK",
    country: "IS",
    exchange: "ICE",
    symbolPattern: "^[A-Z0-9]+\\.IC$",
  },
  {
    code: "tr",
    name: "Turkey",
    region: "europe",
    exchangeName: "Borsa Istanbul",
    currency: "TRY",
    country: "TR",
    exchange: "IST",
    symbolPattern: "^[A-Z0-9]+\\.IS$",
    listSlug: "turkey-stocks",
  },
  {
    code: "ar",
    name: "Argentina",
    region: "americas",
    exchangeName: "Buenos Aires Stock Exchange",
    currency: "ARS",
    country: "AR",
    exchange: "BUE",
    symbolPattern: "^[A-Z0-9]+\\.BA$",
  },
  {
    code: "cl",
    name: "Chile",
    region: "americas",
    exchangeName: "Santiago Stock Exchange",
    currency: "CLP",
    country: "CL",
    exchange: "SGO",
    symbolPattern: "^[A-Z0-9-]+\\.SN$",
    listSlug: "chile-stocks",
  },
  {
    code: "cn",
    name: "China",
    region: "asia-pacific",
    exchangeName: "Shanghai Stock Exchange",
    currency: "CNY",
    country: "CN",
    exchange: "SHH",
    symbolPattern: "^[A-Z0-9]+\\.SS$",
    listSlug: "shanghai-stocks",
  },
  {
    code: "id",
    name: "Indonesia",
    region: "asia-pacific",
    exchangeName: "Indonesia Stock Exchange",
    currency: "IDR",
    country: "ID",
    exchange: "JKT",
    symbolPattern: "^[A-Z0-9]+\\.JK$",
    listSlug: "indonesia-stocks",
  },
  {
    code: "my",
    name: "Malaysia",
    region: "asia-pacific",
    exchangeName: "Bursa Malaysia",
    currency: "MYR",
    country: "MY",
    exchange: "KLS",
    symbolPattern: "^[A-Z0-9]+\\.KL$",
    listSlug: "malaysia-stocks",
  },
  {
    code: "th",
    name: "Thailand",
    region: "asia-pacific",
    exchangeName: "Stock Exchange of Thailand",
    currency: "THB",
    country: "TH",
    exchange: "SET",
    symbolPattern: "^[A-Z0-9]+\\.BK$",
    listSlug: "thailand-stocks",
  },
  {
    code: "sa",
    name: "Saudi Arabia",
    region: "other",
    exchangeName: "Saudi Exchange (Tadawul)",
    currency: "SAR",
    country: "SA",
    exchange: "SAU",
    symbolPattern: "^[0-9]+\\.SR$",
    listSlug: "saudi-stocks",
  },
  {
    code: "ae",
    name: "United Arab Emirates",
    region: "other",
    exchangeName: "Dubai Financial Market",
    currency: "AED",
    country: "AE",
    exchange: "DFM",
    symbolPattern: "^[A-Z0-9]+\\.AE$",
  },
  {
    code: "qa",
    name: "Qatar",
    region: "other",
    exchangeName: "Qatar Stock Exchange",
    currency: "QAR",
    country: "QA",
    exchange: "DOH",
    symbolPattern: "^[A-Z0-9]+\\.QA$",
    listSlug: "qatar-stocks",
  },
];

export function countryHref(code: string) {
  const normalized = code.toLowerCase();
  if (normalized === "us") return "/stocks";
  return `/stocks/country/${normalized}`;
}

export function findCountryMarket(code: string) {
  return COUNTRY_MARKETS.find((market) => market.code === code.toLowerCase()) ?? null;
}

export function countryMarketFromProfile(country?: string | null) {
  if (!country) return null;
  const needle = country.trim().toLowerCase();
  return (
    COUNTRY_MARKETS.find(
      (market) =>
        market.code === needle ||
        market.country?.toLowerCase() === needle ||
        market.name.toLowerCase() === needle,
    ) ?? null
  );
}

const EXCHANGE_LIST_HREF: Record<string, string> = {
  NASDAQ: "/list/nasdaq-stocks",
  NYSE: "/list/nyse-stocks",
  AMEX: "/list/nyse-american-stocks",
  OTC: "/list/otc-stocks",
  FSX: "/list/frankfurt-stocks",
  CNQ: "/list/canadian-securities-exchange",
  NEO: "/list/cboe-canada",
  TWO: "/list/taipei-exchange",
};

export function exchangeStocksHref(exchange: string | null | undefined) {
  if (!exchange) return null;
  const code = exchange.toUpperCase();
  if (EXCHANGE_LIST_HREF[code]) return EXCHANGE_LIST_HREF[code];
  const market = COUNTRY_MARKETS.find((row) => row.exchange?.toUpperCase() === code);
  if (!market) return null;
  return market.listSlug ? `/list/${market.listSlug}` : countryHref(market.code);
}

export const loadCountryStocks = cache(async (code: string) => {
  const market = findCountryMarket(code);
  if (!market) return null;
  const raw = await getScreener(
    {
      ...(market.country ? { country: market.country } : {}),
      ...(market.exchange ? { exchange: market.exchange } : {}),
    },
    { limit: 100, revalidate: 1800 },
  );
  let rows = uniqueBySymbol(raw);
  if (market.symbolPattern) {
    const pattern = new RegExp(market.symbolPattern, "i");
    const matched = rows.filter((row) => pattern.test(row.symbol));
    if (matched.length) rows = matched;
  }
  rows = [...rows].sort((a, b) => (b.marketCap ?? 0) - (a.marketCap ?? 0));
  return { market, rows: await withQuoteChanges(rows) };
});
