import { VehicleHistory } from "@/components/vehicle-history";

export default async function EtfHistoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ symbol: string }>;
  searchParams: Promise<{ years?: string; page?: string }>;
}) {
  const { symbol } = await params;
  const { years, page } = await searchParams;
  return <VehicleHistory symbol={symbol} kind="etf" years={years} page={page} />;
}
