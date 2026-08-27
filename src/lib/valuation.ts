import type { FmpEstimate } from "@/lib/types";
import { nyDateString } from "@/lib/utils";

export function forwardPe(price: number | null | undefined, estimates: FmpEstimate[]) {
  if (price == null || !(price > 0)) return null;
  const today = nyDateString();
  const ranked = [...estimates]
    .filter((row) => typeof row.epsAvg === "number" && row.epsAvg > 0)
    .sort((a, b) => a.date.localeCompare(b.date));
  const next = ranked.find((row) => row.date >= today) ?? ranked[0];
  if (!next?.epsAvg) return null;
  return price / next.epsAvg;
}
