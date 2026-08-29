import { VehicleDividend } from "@/components/vehicle-dividend";

export default async function FundDividendPage({
  params,
  searchParams,
}: {
  params: Promise<{ symbol: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { symbol } = await params;
  const { page } = await searchParams;
  return <VehicleDividend symbol={symbol} kind="fund" page={page} />;
}
