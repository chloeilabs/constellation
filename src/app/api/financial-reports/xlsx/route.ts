import { NextRequest } from "next/server";
import { getFinancialReportXlsx } from "@/lib/fmp";
import { isReportPeriod, isReportYear } from "@/lib/financial-reports";
import { decodeTicker } from "@/lib/listings";

export async function GET(request: NextRequest) {
  const symbol = decodeTicker(request.nextUrl.searchParams.get("symbol") ?? "");
  const year = request.nextUrl.searchParams.get("year") ?? "";
  const period = (request.nextUrl.searchParams.get("period") ?? "").toUpperCase();
  if (!symbol || !isReportYear(year) || !isReportPeriod(period)) {
    return Response.json({ error: "Invalid report request." }, { status: 400 });
  }
  const body = await getFinancialReportXlsx(symbol, year, period);
  if (!body) return Response.json({ error: "Report spreadsheet is unavailable." }, { status: 404 });
  const filename = `${symbol}-${year}-${period}.xlsx`;
  return new Response(body, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "public, max-age=86400",
    },
  });
}
