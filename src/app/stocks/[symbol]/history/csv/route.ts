import { NextRequest } from "next/server";
import { csvResponse, toCsv } from "@/lib/csv";
import { getHistoricalMarketCap } from "@/lib/fmp";
import { historyCapLimit, historyFrom, historyRange, historyRangeSlug } from "@/lib/history";
import { isIndexTicker } from "@/lib/indexes";
import { decodeTicker } from "@/lib/listings";
import { dailyPriceHistoryCsvResponse } from "@/lib/price-history";
import { nyDateString } from "@/lib/utils";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ symbol: string }> },
) {
  const { symbol } = await params;
  const ticker = decodeTicker(symbol);
  if (!ticker) return new Response("Missing symbol", { status: 400 });
  const years = request.nextUrl.searchParams.get("years");
  const table = request.nextUrl.searchParams.get("table") === "market-cap" ? "market-cap" : "prices";
  const index = isIndexTicker(ticker);

  if (table === "market-cap") {
    if (index) return new Response("Not found", { status: 404 });
    const range = historyRange(years);
    const today = nyDateString();
    const from = historyFrom(range, today);
    const caps = await getHistoricalMarketCap(ticker, historyCapLimit(range), from, today);
    const rows = [...caps]
      .sort((a, b) => b.date.localeCompare(a.date))
      .map((row) => [row.date, row.marketCap]);
    return csvResponse(`${ticker}-market-cap-${historyRangeSlug(range)}.csv`, toCsv(["Date", "Market Cap"], rows));
  }

  return dailyPriceHistoryCsvResponse(ticker, years, { adjusted: !index });
}
