import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function first<T>(items: T[] | null | undefined): T | null {
  return items?.[0] ?? null;
}

export function chunk<T>(items: T[], size: number) {
  const groups: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    groups.push(items.slice(i, i + size));
  }
  return groups;
}

export function isoDate(d = new Date()) {
  return d.toISOString().slice(0, 10);
}

export function addDays(d: Date, days: number) {
  const next = new Date(d);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

export function nyDateString(d = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

export function recentFiscalQuarters(count = 6) {
  const now = new Date();
  let year = now.getUTCFullYear();
  let quarter = Math.floor(now.getUTCMonth() / 3) + 1;
  const periods: { year: number; quarter: number }[] = [];
  for (let i = 0; i < count; i++) {
    periods.push({ year, quarter });
    quarter -= 1;
    if (quarter < 1) {
      quarter = 4;
      year -= 1;
    }
  }
  return periods;
}

export function yearEndSnapshots<T extends { date: string }>(rows: T[]) {
  const newestFirst = [...rows].sort((a, b) => b.date.localeCompare(a.date));
  const byYear = new Map<string, T>();
  for (const row of newestFirst) {
    const year = row.date.slice(0, 4);
    if (!byYear.has(year)) byYear.set(year, row);
  }
  return [...byYear.entries()]
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([, row]) => row);
}

export function parseWeightPercentage(value: string | number | null | undefined) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number.parseFloat(value.replace(/%/g, "").trim());
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

export function annualDividendPayments(frequency: string | null | undefined) {
  const value = (frequency || "").toLowerCase();
  if (value.includes("month")) return 12;
  if (value.includes("quarter")) return 4;
  if (value.includes("semi")) return 2;
  if (value.includes("annual") || value.includes("year")) return 1;
  return 4;
}
