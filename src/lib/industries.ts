import { preferPrimaryListings, uniqueBySymbol } from "@/lib/listings";
import {
  getIndustryNames,
  getIndustryPeSnapshot,
  getIndustryPerformance,
  getScreenerPages,
  getSectors,
  withQuoteChanges,
} from "@/lib/fmp";
import { addDays, isoDate, nyDateString } from "@/lib/utils";
import type { FmpScreenerRow } from "@/lib/types";

const SECTOR_FALLBACK = [
  "Technology",
  "Healthcare",
  "Financial Services",
  "Consumer Cyclical",
  "Communication Services",
  "Industrials",
  "Consumer Defensive",
  "Energy",
  "Basic Materials",
  "Real Estate",
  "Utilities",
];

export function industrySlug(name: string) {
  return name
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function findIndustryName(slug: string, names: string[]) {
  const needle = slug.toLowerCase();
  return names.find((name) => industrySlug(name) === needle) ?? null;
}

function averageByName<T>(rows: T[], name: (row: T) => string, value: (row: T) => number) {
  const acc = new Map<string, { sum: number; n: number }>();
  for (const row of rows) {
    const key = name(row);
    const amount = value(row);
    if (!key || !Number.isFinite(amount)) continue;
    const current = acc.get(key) ?? { sum: 0, n: 0 };
    current.sum += amount;
    current.n += 1;
    acc.set(key, current);
  }
  return new Map([...acc.entries()].map(([key, current]) => [key, current.sum / current.n]));
}

function latestSnapshot<T>(today: T[], yesterday: T[]) {
  return today.length ? today : yesterday;
}

export type IndustrySummary = {
  name: string;
  slug: string;
  stocks: number;
  marketCap: number;
  pe: number | null;
  averageChange: number | null;
};

export type SectorSummary = {
  name: string;
  slug: string;
  stocks: number;
  marketCap: number;
  industries: IndustrySummary[];
};

export async function loadIndustryDirectory() {
  const today = nyDateString();
  const yesterday = isoDate(addDays(new Date(`${today}T00:00:00Z`), -1));
  const [sectors, perfToday, perfYesterday, peToday, peYesterday] = await Promise.all([
    getSectors(),
    getIndustryPerformance(today),
    getIndustryPerformance(yesterday),
    getIndustryPeSnapshot(today),
    getIndustryPeSnapshot(yesterday),
  ]);
  const changeByIndustry = averageByName(
    latestSnapshot(perfToday, perfYesterday),
    (row) => row.industry,
    (row) => row.averageChange,
  );
  const peByIndustry = averageByName(
    latestSnapshot(peToday, peYesterday),
    (row) => row.industry,
    (row) => row.pe,
  );

  const sectorNames = sectors.length ? sectors : SECTOR_FALLBACK;
  const grouped = await Promise.all(
    sectorNames.map(async (sector) => {
      const raw = await getScreenerPages({ sector }, { pages: 2, limit: 1000, revalidate: 1800 });
      const rows = preferPrimaryListings(raw);
      const byIndustry = new Map<string, { stocks: number; marketCap: number }>();
      for (const row of rows) {
        const name = row.industry || "Other";
        const current = byIndustry.get(name) ?? { stocks: 0, marketCap: 0 };
        current.stocks += 1;
        current.marketCap += row.marketCap || 0;
        byIndustry.set(name, current);
      }
      const industries = [...byIndustry.entries()]
        .map(([name, stats]) => ({
          name,
          slug: industrySlug(name),
          stocks: stats.stocks,
          marketCap: stats.marketCap,
          pe: peByIndustry.get(name) ?? null,
          averageChange: changeByIndustry.get(name) ?? null,
        }))
        .sort((a, b) => b.marketCap - a.marketCap || b.stocks - a.stocks);
      return {
        name: sector,
        slug: industrySlug(sector),
        stocks: rows.length,
        marketCap: rows.reduce((sum, row) => sum + (row.marketCap || 0), 0),
        industries,
      } satisfies SectorSummary;
    }),
  );

  return grouped
    .filter((sector) => sector.industries.length > 0)
    .sort((a, b) => b.marketCap - a.marketCap);
}

export async function loadIndustryStocks(industry: string) {
  const raw = await getScreenerPages({ industry }, { pages: 2, limit: 1000, revalidate: 900 });
  const rows = preferPrimaryListings(uniqueBySymbol(raw));
  return withQuoteChanges(rows);
}

export async function resolveIndustrySlug(slug: string) {
  const names = await getIndustryNames();
  return findIndustryName(slug, names);
}

export function industryMetrics(rows: Array<FmpScreenerRow & { changePercentage?: number }>) {
  const marketCap = rows.reduce((sum, row) => sum + (row.marketCap || 0), 0);
  const changes = rows
    .map((row) => row.changePercentage)
    .filter((value): value is number => typeof value === "number" && Number.isFinite(value));
  const averageChange =
    changes.length === 0 ? null : changes.reduce((sum, value) => sum + value, 0) / changes.length;
  return { stocks: rows.length, marketCap, averageChange };
}
