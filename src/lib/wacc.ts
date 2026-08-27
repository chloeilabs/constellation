const EQUITY_RISK_PREMIUM = 0.05;

function num(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

/** FMP 10-year Treasury (and similar yields) are percents such as 4.67, not decimals. */
export function treasuryYieldToDecimal(value: unknown) {
  const rate = num(value);
  if (rate == null) return null;
  return rate > 1 ? rate / 100 : rate;
}

function taxRateToDecimal(value: unknown) {
  const rate = num(value);
  if (rate == null) return 0;
  const decimal = rate > 1 ? rate / 100 : rate;
  return Math.min(Math.max(decimal, 0), 0.5);
}

export function estimatedWacc({
  marketCap,
  beta,
  riskFreeYield,
  totalDebt,
  interestExpense,
  taxRate,
}: {
  marketCap: unknown;
  beta: unknown;
  riskFreeYield: unknown;
  totalDebt: unknown;
  interestExpense: unknown;
  taxRate: unknown;
}) {
  const equity = num(marketCap);
  const rf = treasuryYieldToDecimal(riskFreeYield);
  const stockBeta = num(beta);
  if (equity == null || equity <= 0 || rf == null || stockBeta == null) return null;
  const debt = Math.max(num(totalDebt) ?? 0, 0);
  const capital = equity + debt;
  if (capital <= 0) return null;
  const costOfEquity = rf + stockBeta * EQUITY_RISK_PREMIUM;
  const interest = num(interestExpense);
  const interestAbs = interest == null ? null : Math.abs(interest);
  const costOfDebt =
    debt > 0 && interestAbs != null && interestAbs > 0 ? interestAbs / debt : null;
  const afterTaxDebtCost = (costOfDebt ?? 0) * (1 - taxRateToDecimal(taxRate));
  const equityWeight = equity / capital;
  const debtWeight = debt / capital;
  const wacc = equityWeight * costOfEquity + debtWeight * afterTaxDebtCost;
  return {
    wacc,
    costOfEquity,
    costOfDebt,
    afterTaxDebtCost: costOfDebt == null ? null : afterTaxDebtCost,
    equityWeight,
    debtWeight,
    riskFreeRate: rf,
    equityRiskPremium: EQUITY_RISK_PREMIUM,
    beta: stockBeta,
    equity,
    debt,
  };
}
