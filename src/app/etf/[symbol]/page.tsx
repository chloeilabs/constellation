import { VehicleOverview } from "@/components/vehicle-overview";

export default async function EtfPage({
  params,
  searchParams,
}: {
  params: Promise<{ symbol: string }>;
  searchParams: Promise<{ range?: string; adj?: string }>;
}) {
  const { symbol } = await params;
  const { range, adj } = await searchParams;
  return <VehicleOverview symbol={symbol} range={range} adj={adj} kind="etf" />;
}
