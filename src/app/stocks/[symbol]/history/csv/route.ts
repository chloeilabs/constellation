import { NextRequest } from "next/server";
import { csvResponse, toCsv } from "@/lib/csv";
import { getDividendAdjustedChart, getFullDailyChart, getHistoricalMarketCap } from "@/lib/fmp";
import { historyCapLimit, historyFrom, historyRange, historyRangeSlug, withSessionChange } from "@/lib/history";
import { isIndexTicker } from "@/lib/indexes";
import { decodeTicker } from "@/lib/listings";
import { nyDateString } from "@/lib/utils";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ symbol: string }> },
) {
  const { symbol } = await params;
  const ticker = decodeTicker(symbol);
  if (!ticker) return new Response("Missing symbol", { status: 400 });
  const table = request.nextUrl.searchParams.get("table") === "market-cap" ? "market-cap" : "prices";
  const range = historyRange(request.nextUrl.searchParams.get("years"));
  const today = nyDateString();
  const from = historyFrom(range, today);
  const index = isIndexTicker(ticker);
  const slug = historyRangeSlug(range);

  if (table === "market-cap") {
    if (index) return new Response("Not found", { status: 404 });
    const caps = await getHistoricalMarketCap(ticker, historyCapLimit(range), from, today);
    const rows = [...caps]
      .sort((a, b) => b.date.localeCompare(a.date))
      .map((row) => [row.date, row.marketCap]);
    return csvResponse(`${ticker}-market-cap-${slug}.csv`, toCsv(["Date", "Market Cap"], rows));
  }

  const [prices, adjusted] = await Promise.all([
    getFullDailyChart(ticker, from, today),
    index ? Promise.resolve([]) : getDividendAdjustedChart(ticker, from, today),
  ]);
  const adjCloseByDate = new Map(
    adjusted
      .map((row) => [row.date, Number.isFinite(row.adjClose) ? row.adjClose : null] as const)
      .filter((entry): entry is readonly [string, number] => entry[1] != null),
  );
  const daily = withSessionChange(prices, index ? undefined : adjCloseByDate);
  const headers = index
    ? ["Date", "Open", "High", "Low", "Close", "Change %", "Volume"]
    : ["Date", "Open", "High", "Low", "Close", "Adj. Close", "Change %", "Volume"];
  const rows = daily.map((row) =>
    index
      ? [row.date, row.open, row.high, row.low, row.close, row.closeChangePercent, row.volume]
      : [row.date, row.open, row.high, row.low, row.close, row.adjClose, row.closeChangePercent, row.volume],
  );
  return csvResponse(`${ticker}-history-${slug}.csv`, toCsv(headers, rows));
}
