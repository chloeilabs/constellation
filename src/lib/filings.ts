import type { FmpSecFiling } from "@/lib/types";

export const PRIMARY_SEC_FORMS = new Set([
  "10-K",
  "10-Q",
  "8-K",
  "10-K/A",
  "10-Q/A",
  "8-K/A",
  "20-F",
  "20-F/A",
  "40-F",
  "6-K",
  "S-1",
  "S-3",
  "DEF 14A",
]);

export function isPrimarySecForm(formType: string) {
  return PRIMARY_SEC_FORMS.has(formType);
}

export function sortSecFilings(rows: FmpSecFiling[]) {
  return [...rows].sort((a, b) => {
    const primary = Number(isPrimarySecForm(b.formType)) - Number(isPrimarySecForm(a.formType));
    if (primary !== 0) return primary;
    return (b.acceptedDate || b.filingDate).localeCompare(a.acceptedDate || a.filingDate);
  });
}

export function overviewSecFilings(rows: FmpSecFiling[], limit = 8) {
  const primary = rows
    .filter((row) => isPrimarySecForm(row.formType))
    .sort((a, b) => (b.acceptedDate || b.filingDate).localeCompare(a.acceptedDate || a.filingDate))
    .slice(0, limit);
  if (primary.length > 0) return primary;
  return sortSecFilings(rows).slice(0, limit);
}
