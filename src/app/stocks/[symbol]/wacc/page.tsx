import Link from "next/link";
import { Container } from "@/components/container";
import { PageHeader } from "@/components/page-header";
import { SectionNav } from "@/components/section-nav";
import { quoteFundamentalsNav } from "@/lib/nav";
import { MetricCards } from "@/components/metric-cards";
import { formatDate, formatPercentPlain, formatRatio } from "@/lib/format";
import { getBalanceSheets, getIncomeTtm, getProfile, getQuote, getTreasuryRates } from "@/lib/fmp";
import { decodeTicker, stockPath } from "@/lib/listings";
import { addDays, isoDate, nyDateString } from "@/lib/utils";
import { estimatedWacc } from "@/lib/wacc";

export default async function WaccPage({ params }: { params: Promise<{ symbol: string }> }) {
  const { symbol } = await params;
  const ticker = decodeTicker(symbol);
  const today = nyDateString();
  const from = isoDate(addDays(new Date(`${today}T00:00:00Z`), -30));
  const [quote, profile, incomeTtm, balance, rates] = await Promise.all([
    getQuote(ticker),
    getProfile(ticker),
    getIncomeTtm(ticker),
    getBalanceSheets(ticker, "quarter", 1),
    getTreasuryRates(from, today),
  ]);
  const pretax = incomeTtm?.incomeBeforeTax;
  const taxExpense = incomeTtm?.incomeTaxExpense;
  const taxRate =
    typeof pretax === "number" && pretax !== 0 && typeof taxExpense === "number" ? taxExpense / pretax : null;
  const latestRate = [...rates].sort((a, b) => b.date.localeCompare(a.date))[0] ?? null;
  const wacc = estimatedWacc({
    marketCap: quote?.marketCap ?? profile?.marketCap,
    beta: profile?.beta,
    riskFreeYield: latestRate?.year10,
    totalDebt: balance[0]?.totalDebt,
    interestExpense: incomeTtm?.interestExpense,
    taxRate,
  });

  return (
    <Container>
      <PageHeader
        title={`${ticker} Weighted Average Cost of Capital`}
        description="Estimated WACC from live FMP market cap, beta, the latest 10-year Treasury, reported total debt, TTM interest expense, and TTM tax ÷ pretax income. The equity risk premium is a disclosed 5% assumption — not Stock Analysis Pro."
      />
      <SectionNav items={quoteFundamentalsNav(ticker)} />
      {wacc ? (
        <MetricCards
          items={[
            { label: "Estimated WACC", value: formatPercentPlain(wacc.wacc) },
            { label: "Cost of equity", value: formatPercentPlain(wacc.costOfEquity) },
            {
              label: "After-tax cost of debt",
              value: formatPercentPlain(wacc.afterTaxDebtCost),
            },
            {
              label: "Risk-free (10Y)",
              href: "/markets/treasury",
              value: formatPercentPlain(wacc.riskFreeRate),
              hint: latestRate?.date ? formatDate(latestRate.date) : undefined,
            },
            { label: "Beta", value: formatRatio(wacc.beta) },
            { label: "Equity weight", value: formatPercentPlain(wacc.equityWeight) },
          ]}
        />
      ) : (
        <p className="text-sm text-muted">Not enough live inputs to estimate WACC for {ticker}.</p>
      )}
      <p className="mt-4 max-w-3xl text-sm leading-6 text-muted">
        Cost of equity = 10-year Treasury + beta × 5% ERP. Cost of debt uses TTM interest expense ÷ total
        debt, then (1 − tax). Weights use market cap versus book total debt. FMP reports TTM interest
        expense as zero for some issuers, so cost of debt may be unavailable.
      </p>
      <p className="mt-3 text-sm">
        <Link href={stockPath(ticker, "/statistics")} className="text-link hover:underline">
          Statistics
        </Link>
        {" · "}
        <Link href={stockPath(ticker, "/financials")} className="text-link hover:underline">
          Financials
        </Link>
        {" · "}
        <Link href={stockPath(ticker, "/fair-value")} className="text-link hover:underline">
          Fair value
        </Link>
      </p>
    </Container>
  );
}
