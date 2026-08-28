import type { FmpEsgBenchmark } from "@/lib/types";

export function industryKey(value: string | null | undefined) {
  return (value || "")
    .toUpperCase()
    .replace(/&/g, " AND ")
    .replace(/[^A-Z0-9]+/g, " ")
    .trim();
}

export function matchEsgBenchmark(rows: FmpEsgBenchmark[], industry: string | null | undefined) {
  const key = industryKey(industry);
  if (!key) return null;
  const matches = rows.filter((row) => industryKey(row.sector) === key);
  if (matches.length === 0) return null;
  const fiscal = matches.filter((row) => (row.period || "").toUpperCase() === "FY");
  const pool = fiscal.length > 0 ? fiscal : matches;
  return [...pool].sort((a, b) => (b.fiscalYear || 0) - (a.fiscalYear || 0))[0] ?? null;
}
