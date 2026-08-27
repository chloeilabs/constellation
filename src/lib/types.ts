export type FmpQuote = {
  symbol: string;
  name: string;
  price: number;
  changePercentage: number;
  change: number;
  volume: number;
  dayLow: number;
  dayHigh: number;
  yearHigh: number;
  yearLow: number;
  marketCap: number;
  priceAvg50: number;
  priceAvg200: number;
  exchange: string;
  open: number;
  previousClose: number;
  timestamp: number;
};

export type FmpProfile = {
  symbol: string;
  price: number;
  marketCap: number;
  beta: number;
  lastDividend: number;
  range: string;
  change: number;
  changePercentage: number;
  volume: number;
  averageVolume: number;
  companyName: string;
  currency: string;
  cik: string;
  isin: string;
  cusip: string;
  exchangeFullName: string;
  exchange: string;
  industry: string;
  website: string;
  description: string;
  ceo: string;
  sector: string;
  country: string;
  fullTimeEmployees: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  image: string;
  ipoDate: string;
  defaultImage: boolean;
  isEtf: boolean;
  isActivelyTrading: boolean;
  isAdr: boolean;
  isFund: boolean;
};

export type FmpSearchResult = {
  symbol: string;
  name: string;
  currency: string;
  exchangeFullName: string;
  exchange: string;
};

export type FmpMover = {
  symbol: string;
  price: number;
  name: string;
  change: number;
  changesPercentage: number;
  exchange: string;
};

export type FmpNewsItem = {
  symbol: string | null;
  publishedDate: string;
  publisher: string;
  title: string;
  image: string;
  site: string;
  text: string;
  url: string;
};

export type FmpIpo = {
  symbol: string;
  date: string;
  daa?: string;
  company: string;
  exchange: string;
  actions: string;
  shares: number | null;
  priceRange: string | null;
  marketCap: number | null;
};

export type FmpEarnings = {
  symbol: string;
  date: string;
  epsActual: number | null;
  epsEstimated: number | null;
  revenueActual: number | null;
  revenueEstimated: number | null;
  lastUpdated: string;
};

export type FmpDividend = {
  symbol: string;
  date: string;
  recordDate: string;
  paymentDate: string;
  declarationDate: string;
  adjDividend: number;
  dividend: number;
  yield: number;
  frequency: string;
};

export type FmpLightCandle = {
  symbol?: string;
  date: string;
  price: number;
  volume: number;
};

export type FmpIntradayCandle = {
  date: string;
  open: number;
  low: number;
  high: number;
  close: number;
  volume: number;
};

export type FmpPriceChange = {
  symbol: string;
  "1D": number;
  "5D": number;
  "1M": number;
  "3M": number;
  "6M": number;
  ytd: number;
  "1Y": number;
  "3Y": number;
  "5Y": number;
  "10Y": number;
  max: number;
};

export type FmpAftermarketQuote = {
  symbol: string;
  bidSize: number;
  bidPrice: number;
  askSize: number;
  askPrice: number;
  volume: number;
  timestamp: number;
};

export type FmpScreenerRow = {
  symbol: string;
  companyName: string;
  marketCap: number;
  sector: string;
  industry: string;
  beta: number;
  price: number;
  lastAnnualDividend: number;
  volume: number;
  exchange: string;
  exchangeShortName: string;
  country: string;
  isEtf: boolean;
  isFund: boolean;
  isActivelyTrading: boolean;
};

export type FmpIncomeStatement = {
  date: string;
  symbol: string;
  reportedCurrency: string;
  fiscalYear: string;
  period: string;
  fillingDate?: string;
  filingDate?: string;
  revenue: number;
  costOfRevenue: number;
  grossProfit: number;
  researchAndDevelopmentExpenses: number;
  sellingGeneralAndAdministrativeExpenses: number;
  operatingExpenses: number;
  operatingIncome: number;
  interestIncome: number;
  interestExpense: number;
  totalOtherIncomeExpensesNet: number;
  incomeBeforeTax: number;
  incomeTaxExpense: number;
  netIncome: number;
  eps: number;
  epsDiluted: number;
  weightedAverageShsOut: number;
  weightedAverageShsOutDil: number;
  ebitda: number;
  ebit: number;
  [key: string]: string | number | undefined;
};

export type FmpBalanceSheet = {
  date: string;
  symbol: string;
  reportedCurrency: string;
  fiscalYear: string;
  period: string;
  cashAndCashEquivalents: number;
  shortTermInvestments: number;
  cashAndShortTermInvestments: number;
  netReceivables: number;
  inventory: number;
  totalCurrentAssets: number;
  propertyPlantEquipmentNet: number;
  goodwill: number;
  intangibleAssets: number;
  longTermInvestments: number;
  totalNonCurrentAssets: number;
  totalAssets: number;
  accountPayables: number;
  shortTermDebt: number;
  deferredRevenue: number;
  totalCurrentLiabilities: number;
  longTermDebt: number;
  totalNonCurrentLiabilities: number;
  totalLiabilities: number;
  commonStock: number;
  retainedEarnings: number;
  totalStockholdersEquity: number;
  totalEquity: number;
  totalDebt: number;
  netDebt: number;
  [key: string]: string | number | undefined;
};

export type FmpCashFlow = {
  date: string;
  symbol: string;
  reportedCurrency: string;
  fiscalYear: string;
  period: string;
  netIncome: number;
  depreciationAndAmortization: number;
  stockBasedCompensation: number;
  changeInWorkingCapital: number;
  netCashProvidedByOperatingActivities: number;
  investmentsInPropertyPlantAndEquipment: number;
  acquisitionsNet: number;
  purchasesOfInvestments: number;
  salesMaturitiesOfInvestments: number;
  netCashProvidedByInvestingActivities: number;
  netDebtIssuance: number;
  commonStockRepurchased: number;
  netDividendsPaid: number;
  netCashProvidedByFinancingActivities: number;
  netChangeInCash: number;
  cashAtEndOfPeriod: number;
  cashAtBeginningOfPeriod: number;
  operatingCashFlow: number;
  capitalExpenditure: number;
  freeCashFlow: number;
  [key: string]: string | number | undefined;
};

export type FmpKeyMetricsTtm = {
  symbol: string;
  marketCap: number;
  enterpriseValueTTM: number;
  evToSalesTTM: number;
  evToEBITDATTM: number;
  currentRatioTTM: number;
  returnOnAssetsTTM: number;
  returnOnEquityTTM: number;
  returnOnInvestedCapitalTTM: number;
  earningsYieldTTM: number;
  freeCashFlowYieldTTM: number;
  [key: string]: string | number | undefined;
};

export type FmpRatiosTtm = {
  symbol: string;
  grossProfitMarginTTM: number;
  ebitdaMarginTTM: number;
  operatingProfitMarginTTM: number;
  netProfitMarginTTM: number;
  currentRatioTTM: number;
  quickRatioTTM: number;
  priceToEarningsRatioTTM: number;
  priceToBookRatioTTM: number;
  priceToSalesRatioTTM: number;
  priceToFreeCashFlowRatioTTM: number;
  debtToEquityRatioTTM: number;
  dividendYieldTTM: number;
  dividendPayoutRatioTTM: number;
  [key: string]: string | number | undefined;
};

export type FmpRatios = {
  symbol: string;
  date: string;
  fiscalYear: string;
  period: string;
  [key: string]: string | number | undefined;
};

export type FmpPriceTarget = {
  symbol: string;
  targetHigh: number;
  targetLow: number;
  targetConsensus: number;
  targetMedian: number;
};

export type FmpGradesConsensus = {
  symbol: string;
  strongBuy: number;
  buy: number;
  hold: number;
  sell: number;
  strongSell: number;
  consensus: string;
};

export type FmpGrade = {
  symbol: string;
  date: string;
  gradingCompany: string;
  previousGrade: string;
  newGrade: string;
  action: string;
};

export type FmpRatings = {
  symbol: string;
  rating: string;
  overallScore: number;
  discountedCashFlowScore: number;
  returnOnEquityScore: number;
  returnOnAssetsScore: number;
  debtToEquityScore: number;
  priceToEarningsScore: number;
  priceToBookScore: number;
};

export type FmpScores = {
  symbol: string;
  altmanZScore: number;
  piotroskiScore: number;
};

export type FmpPeer = {
  symbol: string;
  companyName: string;
  price: number;
  mktCap: number;
};

export type FmpSectorPerformance = {
  date: string;
  sector: string;
  exchange: string;
  averageChange: number;
};

export type FmpMarketHours = {
  exchange: string;
  name: string;
  openingHour: string;
  closingHour: string;
  timezone: string;
  isMarketOpen: boolean;
};

export type FmpExecutive = {
  title: string;
  name: string;
  pay: number | null;
  currencyPay: string;
  gender: string;
  yearBorn: number | null;
  titleSince: string | null;
  active: boolean;
};

export type FmpEtfInfo = {
  symbol: string;
  name: string;
  description: string;
  isin: string;
  assetClass: string;
  domicile: string;
  website: string;
  etfCompany: string;
  expenseRatio: number;
  assetsUnderManagement: number;
  avgVolume: number;
  inceptionDate: string;
  nav: number;
  navCurrency: string;
  holdingsCount: number;
  isActivelyTrading: boolean;
  sectorsList?: string;
};

export type FmpEtfHolding = {
  symbol: string;
  asset: string;
  name: string;
  sharesNumber: number;
  weightPercentage: number;
  marketValue: number;
  updatedAt: string;
};

export type FmpEtfSector = {
  symbol: string;
  sector: string;
  weightPercentage: number;
};

export type FmpEstimate = {
  symbol: string;
  date: string;
  revenueLow?: number;
  revenueHigh?: number;
  revenueAvg?: number;
  epsAvg?: number;
  epsHigh?: number;
  epsLow?: number;
  numAnalystsRevenue?: number;
  numAnalystsEps?: number;
};

export type ChartPoint = {
  time: string;
  value: number;
  volume?: number;
};

export type StatementPeriod = "annual" | "quarter";
