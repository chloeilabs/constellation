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
  pe?: number;
  eps?: number;
  sharesOutstanding?: number;
  avgVolume?: number;
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
  isEtf?: boolean;
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
  lastPrice?: number;
};

export type FmpAftermarketTrade = {
  symbol: string;
  price: number;
  tradeSize: number | null;
  timestamp: number;
};

export type FmpTechnicalPoint = {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  rsi?: number;
  sma?: number;
  ema?: number;
};

export type FmpEtfListItem = {
  symbol: string;
  name: string;
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

export type FmpPriceTargetSummary = {
  symbol: string;
  lastMonthCount: number;
  lastMonthAvgPriceTarget: number;
  lastQuarterCount: number;
  lastQuarterAvgPriceTarget: number;
  lastYearCount: number;
  lastYearAvgPriceTarget: number;
  allTimeCount: number;
  allTimeAvgPriceTarget: number;
  publishers?: string;
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

export type FmpHistoricalGrade = {
  symbol: string;
  date: string;
  analystRatingsStrongBuy: number;
  analystRatingsBuy: number;
  analystRatingsHold: number;
  analystRatingsSell: number;
  analystRatingsStrongSell: number;
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

export type FmpHistoricalRating = FmpRatings & {
  date: string;
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

export type FmpEtfCountryWeight = {
  country: string;
  weightPercentage: string | number;
};

export type FmpEtfExposure = {
  symbol: string;
  asset: string;
  sharesNumber: number;
  weightPercentage: number;
  marketValue: number;
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

export type FmpIndexConstituent = {
  symbol: string;
  name: string;
  sector: string;
  subSector: string;
  headQuarter: string;
  dateFirstAdded: string | null;
  cik: string;
  founded: string;
};

export type FmpInsiderTrade = {
  symbol: string;
  filingDate: string;
  transactionDate: string;
  reportingCik: string;
  companyCik: string;
  transactionType: string;
  securitiesOwned: number;
  reportingName: string;
  typeOfOwner: string;
  acquisitionOrDisposition: string;
  directOrIndirect: string;
  formType: string;
  securitiesTransacted: number;
  price: number;
  securityName: string;
  url: string;
};

export type FmpInsiderStatistics = {
  symbol: string;
  cik: string;
  year: number;
  quarter: number;
  acquiredTransactions: number;
  disposedTransactions: number;
  acquiredDisposedRatio: number;
  totalAcquired: number;
  totalDisposed: number;
  averageAcquired: number;
  averageDisposed: number;
  totalPurchases: number;
  totalSales: number;
};

export type FmpSplit = {
  symbol: string;
  date: string;
  numerator: number;
  denominator: number;
  splitType: string;
};

export type FmpShareFloat = {
  symbol: string;
  date: string;
  freeFloat: number;
  floatShares: number;
  outstandingShares: number;
  source: string;
};

export type FmpHistoricalMarketCap = {
  symbol: string;
  date: string;
  marketCap: number;
};

export type FmpIncomeGrowth = {
  symbol: string;
  date: string;
  fiscalYear: string;
  period: string;
  growthRevenue: number;
  growthNetIncome: number;
  growthEPS: number;
  growthEPSDiluted: number;
  [key: string]: string | number | undefined;
};

export type FmpFullCandle = {
  symbol?: string;
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  change: number;
  changePercent: number;
  vwap?: number;
};

export type FmpSecFiling = {
  symbol: string;
  cik: string;
  filingDate: string;
  acceptedDate: string;
  formType: string;
  link: string;
  finalLink: string;
};

export type FmpTranscriptDate = {
  quarter: number;
  fiscalYear: number;
  date: string;
};

export type FmpTranscript = {
  symbol: string;
  period: string;
  year: number;
  date: string;
  content: string;
};

export type FmpEconomicEvent = {
  date: string;
  country: string;
  event: string;
  currency: string;
  previous: number | null;
  estimate: number | null;
  actual: number | null;
  change: number | null;
  impact: string;
  changePercentage: number | null;
  unit: string;
};

export type FmpInstitutionalSummary = {
  symbol: string;
  cik: string;
  date: string;
  investorsHolding: number;
  lastInvestorsHolding: number;
  investorsHoldingChange: number;
  numberOf13Fshares: number;
  lastNumberOf13Fshares: number;
  numberOf13FsharesChange: number;
  totalInvested: number;
  lastTotalInvested: number;
  totalInvestedChange: number;
  ownershipPercent: number;
  lastOwnershipPercent: number;
  ownershipPercentChange: number;
  newPositions: number;
  lastNewPositions: number;
  newPositionsChange: number;
  increasedPositions: number;
  lastIncreasedPositions: number;
  increasedPositionsChange: number;
  closedPositions: number;
  lastClosedPositions: number;
  closedPositionsChange: number;
  reducedPositions: number;
  lastReducedPositions: number;
  reducedPositionsChange: number;
  totalCalls: number;
  lastTotalCalls: number;
  totalCallsChange: number;
  totalPuts: number;
  lastTotalPuts: number;
  totalPutsChange: number;
  putCallRatio: number;
  lastPutCallRatio: number;
  putCallRatioChange: number;
};

export type FmpInstitutionalHolder = {
  date: string;
  cik: string;
  filingDate: string;
  investorName: string;
  symbol: string;
  securityName: string;
  sharesNumber: number;
  lastSharesNumber: number;
  changeInSharesNumber: number;
  changeInSharesNumberPercentage: number;
  marketValue: number;
  lastMarketValue: number;
  changeInMarketValue: number;
  ownership: number;
  lastOwnership: number;
  changeInOwnership: number;
  weight: number;
  isNew: boolean;
  isSoldOut: boolean;
  firstAdded: string;
  holdingPeriod: number;
};

export type FmpEmployeeCount = {
  symbol: string;
  cik: string;
  acceptanceTime: string;
  periodOfReport: string;
  companyName: string;
  formType: string;
  filingDate: string;
  employeeCount: number;
  source: string;
};

export type FmpDcf = {
  symbol: string;
  date: string;
  dcf: number;
  stockPrice?: number;
  "Stock Price"?: number;
};

export type FmpRevenueSegment = {
  symbol: string;
  fiscalYear: number | string;
  period: string;
  reportedCurrency: string;
  date: string;
  data: Record<string, number>;
};

export type FmpIndustryPerformance = {
  date: string;
  industry: string;
  exchange: string;
  averageChange: number;
};

export type FmpIndustryPe = {
  date: string;
  industry: string;
  exchange: string;
  pe: number;
};

export type FmpSectorPe = {
  date: string;
  sector: string;
  exchange: string;
  pe: number;
};

export type FmpGradeNews = {
  symbol: string;
  publishedDate: string;
  newsURL: string;
  newsTitle: string;
  newsBaseURL: string;
  newsPublisher: string;
  newGrade: string;
  previousGrade: string;
  gradingCompany: string;
  action: string;
  priceWhenPosted: number;
};

export type FmpCommodity = {
  symbol: string;
  name: string;
  exchange: string | null;
  tradeMonth: string;
  currency: string;
};

export type FmpCommodityQuote = {
  symbol: string;
  price: number;
  change: number;
  volume: number;
};

export type FmpCrypto = {
  symbol: string;
  name: string;
  exchange: string | null;
  icoDate?: string;
  circulatingSupply?: number;
  totalSupply?: number;
};

export type FmpForex = {
  symbol: string;
  fromCurrency: string;
  toCurrency: string;
  fromName: string;
  toName: string;
};

export type FmpKeyMetrics = {
  symbol: string;
  date: string;
  fiscalYear: string;
  period: string;
  [key: string]: string | number | undefined;
};

export type FmpMerger = {
  symbol: string;
  companyName: string;
  cik: string;
  targetedCompanyName: string;
  targetedCik: string;
  targetedSymbol: string;
  transactionDate: string;
  acceptedDate: string;
  link: string;
};

export type FmpIpoDisclosure = {
  symbol: string;
  filingDate: string;
  acceptedDate: string;
  effectivenessDate: string;
  cik: string;
  form: string;
  url: string;
};

export type FmpIpoProspectus = {
  symbol: string;
  acceptedDate: string;
  filingDate: string;
  ipoDate: string;
  cik: string;
  pricePublicPerShare: number | null;
  pricePublicTotal: number | null;
  discountsAndCommissionsPerShare: number | null;
  discountsAndCommissionsTotal: number | null;
  proceedsBeforeExpensesPerShare: number | null;
  proceedsBeforeExpensesTotal: number | null;
  form: string;
  url: string;
};

export type FmpCongressTrade = {
  symbol: string;
  senateID?: string;
  disclosureDate: string;
  transactionDate: string;
  firstName: string;
  lastName: string;
  office: string;
  district: string;
  owner: string;
  assetDescription: string;
  assetType: string;
  type: string;
  amount: string;
  capitalGainsOver200USD?: string;
  comment: string;
  link: string;
};

export type FmpOwnerEarnings = {
  symbol: string;
  reportedCurrency: string;
  fiscalYear: string;
  period: string;
  date: string;
  averagePPE: number;
  maintenanceCapex: number;
  ownersEarnings: number;
  growthCapex: number;
  ownersEarningsPerShare: number;
};

export type FmpEnterpriseValue = {
  symbol: string;
  date: string;
  stockPrice: number;
  numberOfShares: number;
  marketCapitalization: number;
  minusCashAndCashEquivalents: number;
  addTotalDebt: number;
  enterpriseValue: number;
};

export type FmpTreasuryRate = {
  date: string;
  month1: number;
  month2: number;
  month3: number;
  month6: number;
  year1: number;
  year2: number;
  year3: number;
  year5: number;
  year7: number;
  year10: number;
  year20: number;
  year30: number;
};

export type FmpEconomicIndicator = {
  name: string;
  date: string;
  value: number;
};

export type FmpHistoricalConstituent = {
  dateAdded: string;
  addedSecurity: string;
  removedTicker: string | null;
  removedSecurity: string | null;
  date: string;
  symbol: string;
  reason: string;
};

export type FmpSymbolChange = {
  date: string;
  companyName: string;
  oldSymbol: string;
  newSymbol: string;
};

export type FmpDelisted = {
  symbol: string;
  companyName: string;
  exchange: string;
  ipoDate: string;
  delistedDate: string;
};

export type FmpFinancialGrowth = {
  symbol: string;
  date: string;
  fiscalYear: string;
  period: string;
  reportedCurrency?: string;
  revenueGrowth: number;
  grossProfitGrowth: number;
  operatingIncomeGrowth: number;
  netIncomeGrowth: number;
  epsdilutedGrowth: number;
  ebitdaGrowth: number;
  operatingCashFlowGrowth: number;
  freeCashFlowGrowth: number;
  [key: string]: string | number | undefined;
};

export type FmpEsgRating = {
  symbol: string;
  cik: string;
  companyName: string;
  industry: string;
  fiscalYear: number;
  ESGRiskRating: string;
  industryRank: string;
};

export type FmpEsgDisclosure = {
  date: string;
  acceptedDate: string;
  symbol: string;
  cik: string;
  companyName: string;
  formType: string;
  environmentalScore: number;
  socialScore: number;
  governanceScore: number;
  ESGScore: number;
  url: string;
};

export type FmpCompanyNote = {
  cik: string;
  symbol: string;
  title: string;
  exchange: string;
};

export type FmpInstitutionalFiling = {
  cik: string;
  name: string;
  date: string;
  filingDate: string;
  acceptedDate: string;
  formType: string;
  link: string;
  finalLink: string;
};

export type FmpExecutiveCompensation = {
  cik: string;
  symbol: string;
  companyName: string;
  filingDate: string;
  acceptedDate: string;
  nameAndPosition: string;
  year: number;
  salary: number;
  bonus: number;
  stockAward: number;
  optionAward: number;
  incentivePlanCompensation: number;
  allOtherCompensation: number;
  total: number;
  link: string;
};
