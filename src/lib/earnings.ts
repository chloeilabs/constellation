import type { FmpEarnings } from "@/lib/types";
import { nyDateString } from "@/lib/utils";

export function splitCompanyEarnings(rows: FmpEarnings[], today = nyDateString()) {
  const lastReported =
    rows
      .filter((row) => row.epsActual != null && row.date.slice(0, 10) <= today)
      .sort((a, b) => b.date.localeCompare(a.date))[0] ?? null;
  const next =
    rows
      .filter((row) => row.epsActual == null || row.date.slice(0, 10) > today)
      .sort((a, b) => a.date.localeCompare(b.date))[0] ?? null;
  return { lastReported, next };
}

export function earningsSurprise(row: FmpEarnings | null | undefined) {
  if (row?.epsActual == null || row.epsEstimated == null || row.epsEstimated === 0) return null;
  return (row.epsActual - row.epsEstimated) / Math.abs(row.epsEstimated);
}

export function revenueSurprise(row: FmpEarnings | null | undefined) {
  if (row?.revenueActual == null || row.revenueEstimated == null || row.revenueEstimated === 0) return null;
  return (row.revenueActual - row.revenueEstimated) / Math.abs(row.revenueEstimated);
}
