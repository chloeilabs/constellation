import { NextRequest } from "next/server";
import { loadQuoteChart } from "@/lib/chart";

export async function GET(request: NextRequest) {
  const symbol = request.nextUrl.searchParams.get("symbol") ?? "";
  const rangeParam = request.nextUrl.searchParams.get("range");
  if (!symbol) return Response.json([]);
  const { points } = await loadQuoteChart(symbol, rangeParam);
  return Response.json(points);
}
