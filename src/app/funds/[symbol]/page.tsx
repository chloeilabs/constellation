import { VehicleOverview } from "@/components/vehicle-overview";

export default async function FundQuotePage({
  params,
  searchParams,
}: {
  params: Promise<{ symbol: string }>;
  searchParams: Promise<{ range?: string }>;
}) {
  const { symbol } = await params;
  const { range } = await searchParams;
  return <VehicleOverview symbol={symbol} range={range} kind="fund" />;
}
