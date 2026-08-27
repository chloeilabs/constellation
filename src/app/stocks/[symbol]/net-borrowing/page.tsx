import { StatementMetricPage, periodFrom } from "@/components/statement-metric-page";
import { decodeTicker } from "@/lib/listings";

export default async function NetBorrowingPage({
  params,
  searchParams,
}: {
  params: Promise<{ symbol: string }>;
  searchParams: Promise<{ period?: string }>;
}) {
  const { symbol } = await params;
  const { period: periodParam } = await searchParams;
  const ticker = decodeTicker(symbol);
  return (
    <StatementMetricPage
      symbol={ticker}
      period={periodFrom(periodParam)}
      slug="net-borrowing"
      title={`${ticker} Net Borrowing`}
      description="Debt issued minus debt repaid from the cash flow statement. Negative values are net repayments."
      field="netDebtIssuance"
      kind="cash"
      ttmField="netDebtIssuance"
    />
  );
}
