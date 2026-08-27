import { NextRequest } from "next/server";
import { CHART_RANGES, getChartData, type ChartRange } from "@/lib/chart";

export async function GET(request: NextRequest) {
  const symbol = request.nextUrl.searchParams.get("symbol") ?? "";
  const rangeParam = request.nextUrl.searchParams.get("range") ?? "1Y";
  const range = CHART_RANGES.includes(rangeParam as ChartRange) ? (rangeParam as ChartRange) : "1Y";
  if (!symbol) return Response.json([]);
  const points = await getChartData(symbol, range);
  return Response.json(points);
}
