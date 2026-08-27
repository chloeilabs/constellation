import { cache } from "react";
import {
  getInstitutionalDates,
  getInstitutionalExtract,
  getInstitutionalIndustryBreakdown,
  getInstitutionalPerformance,
  getLatestInstitutionalFilings,
} from "@/lib/fmp";
import type {
  FmpInstitutionalExtract,
  FmpInstitutionalIndustry,
  FmpInstitutionalPerformance,
} from "@/lib/types";

export const WELL_KNOWN_FILERS = [
  { cik: "0001067983", name: "Berkshire Hathaway" },
  { cik: "0000102909", name: "Vanguard Group" },
  { cik: "0001364742", name: "BlackRock" },
  { cik: "0000093751", name: "State Street" },
  { cik: "0000315066", name: "Fidelity (FMR)" },
  { cik: "0001350694", name: "Bridgewater Associates" },
  { cik: "0001037389", name: "Renaissance Technologies" },
  { cik: "0001423053", name: "Citadel Advisors" },
] as const;

export function padCik(value: string) {
  const digits = value.replace(/\D/g, "");
  if (!digits) return "";
  return digits.padStart(10, "0");
}

export function institutionalHref(cik: string) {
  const padded = padCik(cik);
  return padded ? `/institutional/${padded}` : "/institutional";
}

export function filerName(cik: string, fallback?: string | null) {
  const padded = padCik(cik);
  return WELL_KNOWN_FILERS.find((filer) => filer.cik === padded)?.name ?? fallback ?? null;
}

export function titleCaseIndustry(value: string) {
  return value
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase())
    .replace(/\bAnd\b/g, "and");
}

export const loadInstitutionalPortfolio = cache(async (cik: string) => {
  const padded = padCik(cik);
  const empty = {
    cik: padded,
    name: null as string | null,
    period: null as { year: number; quarter: number } | null,
    holdings: [] as FmpInstitutionalExtract[],
    filing: null,
    performance: [] as FmpInstitutionalPerformance[],
    latestPerformance: null as FmpInstitutionalPerformance | null,
    industries: [] as FmpInstitutionalIndustry[],
  };
  if (!padded) return { ...empty, cik: "" };

  const [dates, latestFilings, performance] = await Promise.all([
    getInstitutionalDates(padded),
    getLatestInstitutionalFilings(100),
    getInstitutionalPerformance(padded),
  ]);
  const filing = latestFilings.find((row) => padCik(row.cik) === padded) ?? null;
  const rankedPerformance = [...performance].sort((a, b) => (b.date || "").localeCompare(a.date || ""));
  const name = filerName(padded, filing?.name ?? rankedPerformance[0]?.investorName);
  const period = [...dates].sort((a, b) => {
    if (b.year !== a.year) return b.year - a.year;
    return b.quarter - a.quarter;
  })[0] ?? null;

  if (!period) {
    return { ...empty, name, filing, performance: rankedPerformance, latestPerformance: rankedPerformance[0] ?? null };
  }

  const [holdings, industries] = await Promise.all([
    getInstitutionalExtract(padded, period.year, period.quarter),
    getInstitutionalIndustryBreakdown(padded, period.year, period.quarter),
  ]);
  const periodDate = holdings[0]?.date || rankedPerformance[0]?.date || "";
  const latestPerformance =
    rankedPerformance.find((row) => periodDate && row.date?.startsWith(periodDate.slice(0, 10))) ??
    rankedPerformance[0] ??
    null;
  const rankedIndustries = [...industries].sort((a, b) => (b.weight || 0) - (a.weight || 0));

  return {
    cik: padded,
    name,
    period,
    holdings,
    filing,
    performance: rankedPerformance,
    latestPerformance,
    industries: rankedIndustries,
  };
});
