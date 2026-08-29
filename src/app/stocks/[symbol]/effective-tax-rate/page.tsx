import { StatementMetricPage, periodFrom } from "@/components/statement-metric-page";
import { decodeTicker } from "@/lib/listings";

export default async function EffectiveTaxRatePage({
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
      slug="effective-tax-rate"
      title={`${ticker} Effective Tax Rate`}
      description="Income tax expense divided by pretax income."
      field="effectiveTaxRate"
      ttmField="effectiveTaxRate"
      kind="income"
      format="percent"
      formula="Effective Tax Rate = Income Tax ÷ Pretax Income"
    />
  );
}
