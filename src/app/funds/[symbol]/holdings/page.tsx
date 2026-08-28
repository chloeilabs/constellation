import { VehicleHoldings } from "@/components/vehicle-holdings";

export default async function FundHoldingsPage({
  params,
  searchParams,
}: {
  params: Promise<{ symbol: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { symbol } = await params;
  const { page } = await searchParams;
  return <VehicleHoldings symbol={symbol} kind="fund" page={page} />;
}
