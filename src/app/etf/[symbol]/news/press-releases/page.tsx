import { VehicleNews } from "@/components/vehicle-news";

export default async function EtfPressReleasesPage({
  params,
  searchParams,
}: {
  params: Promise<{ symbol: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { symbol } = await params;
  const { page } = await searchParams;
  return <VehicleNews symbol={symbol} kind="etf" page={page} feed="press" />;
}
