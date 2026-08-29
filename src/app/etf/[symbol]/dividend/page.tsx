import { VehicleDividend } from "@/components/vehicle-dividend";

export default async function EtfDividendPage({
  params,
  searchParams,
}: {
  params: Promise<{ symbol: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { symbol } = await params;
  const { page } = await searchParams;
  return <VehicleDividend symbol={symbol} kind="etf" page={page} />;
}
