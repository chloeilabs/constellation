import type { FmpFinancialReportDate, FmpFinancialReportJson } from "@/lib/types";

const META_KEYS = new Set(["symbol", "period", "year"]);

export const REPORT_PERIODS = ["FY", "Q1", "Q2", "Q3", "Q4"] as const;

export function isReportPeriod(value: string): value is (typeof REPORT_PERIODS)[number] {
  return REPORT_PERIODS.includes(value.toUpperCase() as (typeof REPORT_PERIODS)[number]);
}

export function isReportYear(value: string) {
  return /^\d{4}$/.test(value);
}

export type ReportLine = {
  label: string;
  values: unknown[];
  section?: boolean;
};

export type ReportSection = {
  id: string;
  title: string;
  caption?: string;
  columns: string[];
  rows: ReportLine[];
};

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : null;
}

function firstEntry(row: Record<string, unknown>) {
  const key = Object.keys(row)[0];
  return key ? { key, value: row[key] } : null;
}

export function parseFinancialReport(report: FmpFinancialReportJson | null | undefined): ReportSection[] {
  if (!report) return [];
  const sections: ReportSection[] = [];
  for (const [title, raw] of Object.entries(report)) {
    if (META_KEYS.has(title) || !Array.isArray(raw) || raw.length === 0) continue;
    const items = raw.map(asRecord).filter((row): row is Record<string, unknown> => Boolean(row));
    if (items.length === 0) continue;

    let caption: string | undefined;
    let columns: string[] = [];
    let start = 0;
    const first = firstEntry(items[0]);
    if (first && Array.isArray(first.value) && first.value.every((value) => typeof value === "string" || value === "")) {
      const second = items[1] ? firstEntry(items[1]) : null;
      if (second && (second.key === "items" || second.key.toLowerCase() === "items") && Array.isArray(second.value)) {
        caption = first.value.filter(Boolean).join(" · ") || undefined;
        columns = second.value.map((value) => String(value ?? ""));
        start = 2;
      } else if (first.key.toLowerCase() === "items") {
        columns = first.value.map((value) => String(value ?? ""));
        start = 1;
      } else if (
        second &&
        Array.isArray(second.value) &&
        second.value.every((value) => typeof value === "string" || value === "") &&
        second.value.some((value) => String(value).match(/\d{4}|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec/i))
      ) {
        caption = first.value.filter(Boolean).join(" · ") || undefined;
        columns = second.value.map((value) => String(value ?? ""));
        start = 2;
      } else {
        caption = first.value.filter(Boolean).join(" · ") || undefined;
        start = 1;
      }
    }

    const rows: ReportLine[] = [];
    for (const item of items.slice(start)) {
      const entry = firstEntry(item);
      if (!entry) continue;
      if (entry.key.toLowerCase() === "items" && Array.isArray(entry.value) && columns.length === 0) {
        columns = entry.value.map((value) => String(value ?? ""));
        continue;
      }
      const values = Array.isArray(entry.value) ? entry.value : [entry.value];
      const empty = values.every((value) => value === "" || value == null);
      rows.push({
        label: entry.key,
        values,
        section: empty,
      });
    }
    if (rows.length === 0 && !caption) continue;
    sections.push({
      id: title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || `section-${sections.length}`,
      title: title.replace(/\s+/g, " ").trim(),
      caption,
      columns,
      rows,
    });
  }
  return sections;
}

export function sortReportDates(rows: FmpFinancialReportDate[]) {
  const rank = (period: string) => {
    const upper = period.toUpperCase();
    if (upper === "FY") return 5;
    const match = upper.match(/^Q([1-4])$/);
    return match ? Number(match[1]) : 0;
  };
  return [...rows].sort((a, b) => {
    const year = Number(b.fiscalYear) - Number(a.fiscalYear);
    if (year) return year;
    return rank(String(b.period)) - rank(String(a.period));
  });
}

export function statementSections(sections: ReportSection[]) {
  const preferred = sections.filter((section) =>
    /consolidated statements|balance sheets/i.test(section.title),
  );
  return preferred.length ? preferred : sections.filter((section) => !/cover page/i.test(section.title)).slice(0, 8);
}
