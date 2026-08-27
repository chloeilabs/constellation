import { notFound, redirect } from "next/navigation";

export default async function StockComparePairPage({ params }: { params: Promise<{ pair: string }> }) {
  const { pair } = await params;
  const match = pair.match(/^([A-Za-z0-9.]+)-vs-([A-Za-z0-9.]+)$/);
  if (!match) notFound();
  redirect(`/compare?symbols=${match[1].toUpperCase()},${match[2].toUpperCase()}`);
}
