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

export const SEC_FORM_TITLES: Record<string, string> = {
  "10-K": "Annual Report",
  "10-Q": "Quarterly Report",
  "8-K": "Current Report",
  "10-K/A": "Annual Report (Amendment)",
  "10-Q/A": "Quarterly Report (Amendment)",
  "8-K/A": "Current Report (Amendment)",
  "20-F": "Annual Report",
  "20-F/A": "Annual Report (Amendment)",
  "40-F": "Annual Report",
  "6-K": "Current Report",
  "DEF 14A": "Proxy Statement",
  DEFA14A: "Proxy Statement",
  SD: "Form - SD",
  "144": "Filing",
  "SCHEDULE 13G": "Filing",
  "SC 13G": "Filing",
  "SC 13G/A": "Filing",
  "3": "Initial Statement of Beneficial Ownership",
  "4": "Statement of Changes in Beneficial Ownership",
  "5": "Annual Statement of Beneficial Ownership",
};

export type SecFilingCategory = "all" | "annual" | "quarterly" | "current" | "proxy";

export function isPrimarySecForm(formType: string) {
  return PRIMARY_SEC_FORMS.has(formType);
}

export function secFormTitle(formType: string) {
  return SEC_FORM_TITLES[formType] ?? formType;
}

export function secFormCategory(formType: string): Exclude<SecFilingCategory, "all"> | "other" {
  if (formType === "10-K" || formType === "10-K/A" || formType === "20-F" || formType === "20-F/A" || formType === "40-F") {
    return "annual";
  }
  if (formType === "10-Q" || formType === "10-Q/A") return "quarterly";
  if (formType === "8-K" || formType === "8-K/A" || formType === "6-K") return "current";
  if (formType === "DEF 14A" || formType === "DEFA14A") return "proxy";
  return "other";
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
