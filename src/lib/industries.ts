import { preferPrimaryListings, uniqueBySymbol } from "@/lib/listings";
import {
  getIndustryNames,
  getIndustryPeSnapshot,
  getIndustryPerformance,
  getScreenerPages,
  getSectorPeSnapshot,
  getSectorPerformance,
  getSectors,
  withQuoteChanges,
} from "@/lib/fmp";
import { addDays, isoDate, nyDateString } from "@/lib/utils";
import type { FmpScreenerRow } from "@/lib/types";

export const MARKET_SECTORS = [
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
] as const;

const SECTOR_FALLBACK = [...MARKET_SECTORS];

export function uniqueByPreferUsExchange<T extends { exchange?: string }>(
  rows: readonly T[],
  key: (row: T) => string,
): T[] {
  const rank = (exchange?: string) => {
    const value = (exchange ?? "").toUpperCase();
    if (value.includes("NASDAQ")) return 3;
    if (value.includes("NYSE")) return 2;
    if (value === "US") return 1;
    return 0;
  };
  const map = new Map<string, T>();
  for (const row of rows) {
    const name = key(row);
    if (!name) continue;
    const existing = map.get(name);
    if (!existing || rank(row.exchange) > rank(existing.exchange)) {
      map.set(name, row);
    }
  }
  return [...map.values()];
}

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

export function sectorHref(name: string) {
  return `/stocks/sector/${industrySlug(name)}`;
}

export async function resolveSectorSlug(slug: string) {
  const live = await getSectors();
  const names = live.length ? live : SECTOR_FALLBACK;
  const needle = slug.toLowerCase();
  return names.find((name) => industrySlug(name) === needle) ?? null;
}

export async function loadSectorDetail(sectorName: string) {
  const today = nyDateString();
  const yesterday = isoDate(addDays(new Date(`${today}T00:00:00Z`), -1));
  const [raw, peToday, peYesterday, perfToday, perfYesterday] = await Promise.all([
    getScreenerPages({ sector: sectorName }, { pages: 2, limit: 1000, revalidate: 900 }),
    getSectorPeSnapshot(today),
    getSectorPeSnapshot(yesterday),
    getSectorPerformance(today),
    getSectorPerformance(yesterday),
  ]);
  const listed = preferPrimaryListings(uniqueBySymbol(raw));
  const ranked = [...listed].sort((a, b) => (b.marketCap || 0) - (a.marketCap || 0));
  const top = await withQuoteChanges(ranked.slice(0, 100));

  const peRows = uniqueByPreferUsExchange(peToday.length ? peToday : peYesterday, (row) => row.sector);
  const perfRows = uniqueByPreferUsExchange(perfToday.length ? perfToday : perfYesterday, (row) => row.sector);
  const pe = peRows.find((row) => row.sector === sectorName)?.pe ?? null;
  const averageChange = perfRows.find((row) => row.sector === sectorName)?.averageChange ?? null;

  const byIndustry = new Map<string, { stocks: number; marketCap: number }>();
  for (const row of listed) {
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
    }))
    .sort((a, b) => b.marketCap - a.marketCap || b.stocks - a.stocks);

  const yields = listed
    .map((row) => (row.price > 0 && row.lastAnnualDividend > 0 ? (row.lastAnnualDividend / row.price) * 100 : null))
    .filter((value): value is number => value != null && Number.isFinite(value) && value < 20);
  const averageYield =
    yields.length === 0 ? null : yields.reduce((sum, value) => sum + value, 0) / yields.length;

  return {
    stocks: listed.length,
    marketCap: listed.reduce((sum, row) => sum + (row.marketCap || 0), 0),
    pe,
    averageChange,
    averageYield,
    industries,
    rows: top,
  };
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
