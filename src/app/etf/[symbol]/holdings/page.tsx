import { VehicleHoldings } from "@/components/vehicle-holdings";

export default async function EtfHoldingsPage({ params }: { params: Promise<{ symbol: string }> }) {
  const { symbol } = await params;
  return <VehicleHoldings symbol={symbol} kind="etf" />;
}
