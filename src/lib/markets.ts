import type { FmpBeneficialOwner, FmpCommodityQuote, FmpIndexListItem, FmpMarketHours } from "@/lib/types";
import { nyDateString } from "@/lib/utils";

export const PINNED_INDEXES = [
  "^GSPC",
  "^DJI",
  "^IXIC",
  "^NDX",
  "^RUT",
  "^VIX",
  "^N225",
  "^FTSE",
  "^GDAXI",
  "^FCHI",
  "^HSI",
  "^AXJO",
  "^GSPTSE",
  "^BVSP",
  "^KS11",
  "^TWII",
] as const;

const REPORTING_PERSON_TYPE: Record<string, string> = {
  IA: "Investment adviser",
  HC: "Holding company",
  IN: "Individual",
  BK: "Bank",
  CO: "Company",
  IC: "Insurance",
  EP: "Employee plan",
};

export function reportingPersonType(value: string | null | undefined) {
  if (!value) return "—";
  return value
    .split(",")
    .map((part) => REPORTING_PERSON_TYPE[part.trim()] ?? part.trim())
    .join(", ");
}

export function parseBeneficialPercent(value: string | number | null | undefined) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number.parseFloat(value.replace(/%/g, "").trim());
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

export function parseBeneficialShares(value: string | number | null | undefined) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number.parseInt(value.replace(/,/g, "").trim(), 10);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

export function disclosureWeightPercent(value: number | null | undefined) {
  if (value == null || !Number.isFinite(value)) return null;
  // FMP mixes 0–1 fractions and 0–100 percents on fund-disclosure weights.
  return value <= 1 ? value * 100 : value;
}

export function latestFundHolders<T extends { cik: string; holder: string; dateReported: string; shares: number }>(
  rows: T[],
) {
  const byHolder = new Map<string, T>();
  for (const row of rows) {
    const holder = (row.holder || "").trim();
    if (!holder || !(row.shares > 0)) continue;
    const key = `${row.cik}|${holder.toLowerCase()}`;
    const prev = byHolder.get(key);
    if (!prev) {
      byHolder.set(key, row);
      continue;
    }
    const date = (row.dateReported || "").localeCompare(prev.dateReported || "");
    if (date > 0 || (date === 0 && (row.shares || 0) > (prev.shares || 0))) {
      byHolder.set(key, row);
    }
  }
  return [...byHolder.values()].sort((a, b) => (b.shares || 0) - (a.shares || 0));
}

export function latestBeneficialOwners(rows: FmpBeneficialOwner[], minYear = new Date().getFullYear() - 3) {
  const cutoff = `${minYear}-01-01`;
  const byName = new Map<string, FmpBeneficialOwner>();
  for (const row of rows) {
    const name = (row.nameOfReportingPerson || "").replace(/^\(\d+\)\s*/, "").trim();
    if (!name) continue;
    if ((row.filingDate || "") < cutoff) continue;
    const percent = parseBeneficialPercent(row.percentOfClass);
    if (percent == null || percent < 0.5 || percent > 40) continue;
    const key = name.toLowerCase();
    const prev = byName.get(key);
    if (!prev || (row.filingDate || "") > (prev.filingDate || "")) {
      byName.set(key, { ...row, nameOfReportingPerson: name });
    }
  }
  return [...byName.values()].sort((a, b) => {
    return (parseBeneficialPercent(b.percentOfClass) ?? 0) - (parseBeneficialPercent(a.percentOfClass) ?? 0);
  });
}

export function sortExchangeHours(rows: FmpMarketHours[]) {
  return [...rows].sort((a, b) => {
    if (a.isMarketOpen !== b.isMarketOpen) return a.isMarketOpen ? -1 : 1;
    return (a.name || a.exchange).localeCompare(b.name || b.exchange);
  });
}

export function holidaySchedule<T extends { date: string }>(rows: T[], from = nyDateString()) {
  const upcoming = [...rows]
    .filter((row) => (row.date || "") >= from)
    .sort((a, b) => a.date.localeCompare(b.date));
  const recent = [...rows]
    .filter((row) => (row.date || "") < from)
    .sort((a, b) => b.date.localeCompare(a.date));
  return { upcoming, recent };
}

export function upcomingHolidays<T extends { date: string }>(rows: T[], from = nyDateString()) {
  return holidaySchedule(rows, from).upcoming;
}

export function joinIndexQuotes(list: FmpIndexListItem[], quotes: FmpCommodityQuote[]) {
  const bySymbol = new Map(quotes.map((row) => [row.symbol, row]));
  const pin = new Map<string, number>(PINNED_INDEXES.map((symbol, index) => [symbol, index]));
  return list
    .map((item) => {
      const quote = bySymbol.get(item.symbol);
      return {
        symbol: item.symbol,
        name: item.name,
        exchange: item.exchange,
        currency: item.currency,
        price: quote?.price ?? null,
        change: quote?.change ?? null,
        volume: quote?.volume ?? null,
        pinned: pin.get(item.symbol) ?? 1000,
      };
    })
    .filter((row) => row.price != null && row.price > 0)
    .sort((a, b) => a.pinned - b.pinned || a.name.localeCompare(b.name));
}
