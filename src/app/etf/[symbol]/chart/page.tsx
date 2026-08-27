import { VehicleChart } from "@/components/vehicle-chart";

export default async function EtfChartPage({
  params,
  searchParams,
}: {
  params: Promise<{ symbol: string }>;
  searchParams: Promise<{ range?: string }>;
}) {
  const { symbol } = await params;
  const { range } = await searchParams;
  return <VehicleChart symbol={symbol} range={range} kind="etf" />;
}
