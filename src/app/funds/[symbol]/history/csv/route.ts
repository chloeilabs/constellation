import { NextRequest } from "next/server";
import { decodeTicker } from "@/lib/listings";
import { dailyPriceHistoryCsvResponse } from "@/lib/price-history";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ symbol: string }> },
) {
  const { symbol } = await params;
  const ticker = decodeTicker(symbol);
  if (!ticker) return new Response("Missing symbol", { status: 400 });
  return dailyPriceHistoryCsvResponse(ticker, request.nextUrl.searchParams.get("years"));
}
