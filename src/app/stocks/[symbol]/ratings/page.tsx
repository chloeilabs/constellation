import { redirect } from "next/navigation";
import { stockPath } from "@/lib/listings";

export default async function RatingsRedirect({ params }: { params: Promise<{ symbol: string }> }) {
  const { symbol } = await params;
  redirect(stockPath(symbol, "/forecast"));
}
