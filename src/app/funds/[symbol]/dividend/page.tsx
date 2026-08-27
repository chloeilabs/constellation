import { VehicleDividend } from "@/components/vehicle-dividend";

export default async function FundDividendPage({ params }: { params: Promise<{ symbol: string }> }) {
  const { symbol } = await params;
  return <VehicleDividend symbol={symbol} />;
}
