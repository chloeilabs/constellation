import { csvResponse, toCsv } from "@/lib/csv";
import { getDividendAdjustedChart, getFullDailyChart } from "@/lib/fmp";
import { historyFrom, historyRange, historyRangeSlug, withSessionChange } from "@/lib/history";
import { nyDateString } from "@/lib/utils";

export async function loadDailyPriceHistory(
  ticker: string,
  yearsParam?: string | null,
  options?: { adjusted?: boolean },
) {
  const range = historyRange(yearsParam);
  const today = nyDateString();
  const from = historyFrom(range, today);
  const useAdj = options?.adjusted !== false;
  const [prices, adjusted] = await Promise.all([
    getFullDailyChart(ticker, from, today),
    useAdj ? getDividendAdjustedChart(ticker, from, today) : Promise.resolve([]),
  ]);
  const adjCloseByDate = new Map(
    adjusted
      .map((row) => [row.date, Number.isFinite(row.adjClose) ? row.adjClose : null] as const)
      .filter((entry): entry is readonly [string, number] => entry[1] != null),
  );
  return {
    range,
    today,
    from,
    daily: withSessionChange(prices, useAdj ? adjCloseByDate : undefined),
    yearsQuery: range === "6" ? undefined : range,
    rangeSlug: historyRangeSlug(range),
  };
}

export async function dailyPriceHistoryCsvResponse(
  ticker: string,
  yearsParam?: string | null,
  options?: { adjusted?: boolean },
) {
  const showAdj = options?.adjusted !== false;
  const { daily, rangeSlug } = await loadDailyPriceHistory(ticker, yearsParam, options);
  const headers = showAdj
    ? ["Date", "Open", "High", "Low", "Close", "Adj. Close", "Change %", "Volume"]
    : ["Date", "Open", "High", "Low", "Close", "Change %", "Volume"];
  const rows = daily.map((row) =>
    showAdj
      ? [row.date, row.open, row.high, row.low, row.close, row.adjClose, row.closeChangePercent, row.volume]
      : [row.date, row.open, row.high, row.low, row.close, row.closeChangePercent, row.volume],
  );
  return csvResponse(`${ticker}-history-${rangeSlug}.csv`, toCsv(headers, rows));
}
