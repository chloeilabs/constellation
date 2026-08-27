import { VehicleNews } from "@/components/vehicle-news";

export default async function EtfNewsPage({ params }: { params: Promise<{ symbol: string }> }) {
  const { symbol } = await params;
  return <VehicleNews symbol={symbol} kind="etf" />;
}
