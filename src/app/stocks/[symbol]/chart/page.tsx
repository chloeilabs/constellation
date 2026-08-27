import { Container } from "@/components/container";
import { PageHeader } from "@/components/page-header";
import { PriceChart } from "@/components/price-chart";
import { CHART_RANGES, getChartData, type ChartRange } from "@/lib/chart";
import { getPriceChange } from "@/lib/fmp";
import { ChangePercent } from "@/components/change";

export default async function ChartPage({
  params,
  searchParams,
}: {
  params: Promise<{ symbol: string }>;
  searchParams: Promise<{ range?: string }>;
}) {
  const { symbol } = await params;
  const { range: rangeParam } = await searchParams;
  const ticker = symbol.toUpperCase();
  const range = CHART_RANGES.includes(rangeParam as ChartRange) ? (rangeParam as ChartRange) : "1Y";
  const [points, changes] = await Promise.all([getChartData(ticker, range), getPriceChange(ticker)]);

  const periods = [
    ["1D", changes?.["1D"]],
    ["5D", changes?.["5D"]],
    ["1M", changes?.["1M"]],
    ["3M", changes?.["3M"]],
    ["6M", changes?.["6M"]],
    ["YTD", changes?.ytd],
    ["1Y", changes?.["1Y"]],
    ["5Y", changes?.["5Y"]],
    ["MAX", changes?.max],
  ] as const;

  return (
    <Container>
      <PageHeader title={`${ticker} Chart`} description="Interactive historical price chart." />
      <PriceChart points={points} range={range} symbol={ticker} />
      <div className="mt-6 overflow-x-auto rounded-lg border border-border">
        <table className="sa-table">
          <thead>
            <tr>
              {periods.map(([label]) => (
                <th key={label} className="num">
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              {periods.map(([label, value]) => (
                <td key={label} className="num">
                  <ChangePercent value={value} />
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </Container>
  );
}
