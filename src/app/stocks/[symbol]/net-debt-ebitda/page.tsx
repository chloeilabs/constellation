import { RatioMetricPage, periodFrom } from "@/components/ratio-metric-page";
import { decodeTicker } from "@/lib/listings";

export default async function NetDebtEbitdaPage({
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
    <RatioMetricPage
      symbol={ticker}
      period={periodFrom(periodParam)}
      slug="net-debt-ebitda"
      title={`${ticker} Net Debt / EBITDA`}
      description="Net debt divided by EBITDA from live price, cash, and FMP filings."
      field="netDebtToEBITDA"
      ttmField="netDebtToEBITDATTM"
      valueLabel="Net Debt / EBITDA"
      formula="Net Debt / EBITDA = (Total Debt − Cash & Investments) ÷ EBITDA"
      priceBased
    />
  );
}
