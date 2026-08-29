import type { FmpFullCandle } from "@/lib/types";
import { addDays, isoDate } from "@/lib/utils";

export type HistoryRange = "6" | "1" | "5" | "10" | "max";

export function historyRange(value?: string | null): HistoryRange {
  if (value === "1" || value === "5" || value === "10" || value === "max") return value;
  return "6";
}

export function historyFrom(range: HistoryRange, today: string) {
  if (range === "max") return "1970-01-01";
  const days =
    range === "6" ? 200 : range === "1" ? 400 : range === "5" ? 365 * 5 + 20 : 365 * 10 + 20;
  return isoDate(addDays(new Date(`${today}T00:00:00Z`), -days));
}

export function historyCapLimit(range: HistoryRange) {
  return range === "6" ? 220 : range === "1" ? 400 : range === "5" ? 1500 : range === "10" ? 2800 : 5000;
}

export function historyRangeSlug(range: HistoryRange) {
  return range === "max" ? "max" : range === "6" ? "6m" : `${range}y`;
}

function finite(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

/** Session change versus the previous close, matching Stock Analysis history. */
export function withSessionChange(rows: FmpFullCandle[], adjCloseByDate?: Map<string, number>) {
  const chronological = [...rows].sort((a, b) => a.date.localeCompare(b.date));
  return chronological
    .map((row, index) => {
      const prev = chronological[index - 1];
      const closeChangePercent =
        prev && prev.close ? ((row.close - prev.close) / prev.close) * 100 : finite(row.changePercent);
      return {
        ...row,
        adjClose: adjCloseByDate?.get(row.date) ?? null,
        closeChangePercent,
      };
    })
    .reverse();
}
