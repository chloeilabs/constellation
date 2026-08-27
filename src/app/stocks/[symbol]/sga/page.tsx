import { StatementMetricPage, periodFrom } from "@/components/statement-metric-page";
import { decodeTicker } from "@/lib/listings";

export default async function SgaPage({
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
      slug="sga"
      title={`${ticker} Selling, General & Administrative`}
      description="Selling, general, and administrative expense from the income statement."
      field="sellingGeneralAndAdministrativeExpenses"
      kind="income"
      ttmField="sellingGeneralAndAdministrativeExpenses"
    />
  );
}
