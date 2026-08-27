import { getInstitutionalDates, getInstitutionalExtract, getLatestInstitutionalFilings } from "@/lib/fmp";
import type { FmpInstitutionalExtract } from "@/lib/types";

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

export async function loadInstitutionalPortfolio(cik: string) {
  const padded = padCik(cik);
  if (!padded) {
    return { cik: "", name: null, period: null, holdings: [] as FmpInstitutionalExtract[], filing: null };
  }

  const [dates, latestFilings] = await Promise.all([
    getInstitutionalDates(padded),
    getLatestInstitutionalFilings(100),
  ]);
  const filing = latestFilings.find((row) => padCik(row.cik) === padded) ?? null;
  const name = filerName(padded, filing?.name);
  const period = [...dates].sort((a, b) => {
    if (b.year !== a.year) return b.year - a.year;
    return b.quarter - a.quarter;
  })[0] ?? null;

  if (!period) {
    return { cik: padded, name, period: null, holdings: [] as FmpInstitutionalExtract[], filing };
  }

  const holdings = await getInstitutionalExtract(padded, period.year, period.quarter);
  return { cik: padded, name, period, holdings, filing };
}
