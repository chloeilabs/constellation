import { VehicleChart } from "@/components/vehicle-chart";

export default async function EtfChartPage({
  params,
  searchParams,
}: {
  params: Promise<{ symbol: string }>;
  searchParams: Promise<{ range?: string; adj?: string }>;
}) {
  const { symbol } = await params;
  const { range, adj } = await searchParams;
  return <VehicleChart symbol={symbol} range={range} adj={adj} kind="etf" />;
}
