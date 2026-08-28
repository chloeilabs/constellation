import { cache } from "react";
import {
  getHouseLatest,
  getHouseTrades,
  getHouseTradesByName,
  getSenateLatest,
  getSenateNetWorthArchive,
  getSenatePositions,
  getSenateProfile,
  getSenateTrades,
  getSenateTradesByName,
} from "@/lib/fmp";
import { isForeignListingSymbol } from "@/lib/listings";
import type { FmpCongressTrade, FmpSenateNetWorth, FmpSenatePosition, FmpSenateProfile } from "@/lib/types";

export type CongressChamber = "all" | "senate" | "house";

export type CongressTradeRow = FmpCongressTrade & {
  chamber: "Senate" | "House";
};

export function politicianName(row: Pick<FmpCongressTrade, "firstName" | "lastName" | "office">) {
  const name = `${row.firstName || ""} ${row.lastName || ""}`.trim();
  return name || row.office || "—";
}

export function slugifyPolitician(value: string) {
  return value
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function politicianSlug(row: Pick<FmpCongressTrade, "firstName" | "lastName" | "office">) {
  return slugifyPolitician(politicianName(row));
}

export function politicianHref(row: Pick<FmpCongressTrade, "firstName" | "lastName" | "office">) {
  const slug = politicianSlug(row);
  return slug ? `/congress/${slug}` : "/congress";
}

export function congressSide(type: string | null | undefined) {
  const value = (type || "").toLowerCase();
  if (value.includes("purchase") || value.includes("buy")) return "Buy";
  if (value.includes("sale") || value.includes("sell")) return "Sell";
  if (value.includes("exchange")) return "Exchange";
  return type || "—";
}

function withChamber(rows: FmpCongressTrade[], chamber: "Senate" | "House"): CongressTradeRow[] {
  return rows
    .filter((row) => row.symbol && !isForeignListingSymbol(row.symbol))
    .map((row) => ({ ...row, chamber }));
}

export function sortCongressTrades(rows: CongressTradeRow[]) {
  return [...rows].sort((a, b) => {
    const date = (b.transactionDate || b.disclosureDate || "").localeCompare(a.transactionDate || a.disclosureDate || "");
    if (date) return date;
    return (b.disclosureDate || "").localeCompare(a.disclosureDate || "");
  });
}

export async function loadCongressTrades(chamber: CongressChamber, limit = 80) {
  const pages = Math.max(1, Math.ceil(limit / 100));
  if (chamber === "senate") {
    return sortCongressTrades(await loadChamberPages(getSenateLatest, "Senate", pages)).slice(0, limit);
  }
  if (chamber === "house") {
    return sortCongressTrades(await loadChamberPages(getHouseLatest, "House", pages)).slice(0, limit);
  }
  const [senate, house] = await Promise.all([
    loadChamberPages(getSenateLatest, "Senate", pages),
    loadChamberPages(getHouseLatest, "House", pages),
  ]);
  return sortCongressTrades([...senate, ...house]).slice(0, limit);
}

export async function loadCongressTradesArchive(chamber: CongressChamber) {
  const pages = 3;
  if (chamber === "senate") {
    return sortCongressTrades(await loadChamberPages(getSenateLatest, "Senate", pages));
  }
  if (chamber === "house") {
    return sortCongressTrades(await loadChamberPages(getHouseLatest, "House", pages));
  }
  const [senate, house] = await Promise.all([
    loadChamberPages(getSenateLatest, "Senate", pages),
    loadChamberPages(getHouseLatest, "House", pages),
  ]);
  return sortCongressTrades([...senate, ...house]);
}

async function loadChamberPages(
  load: (limit: number, page?: number) => Promise<FmpCongressTrade[]>,
  chamber: "Senate" | "House",
  pages: number,
) {
  const chunks = await Promise.all(Array.from({ length: pages }, (_, page) => load(100, page)));
  const seen = new Set<string>();
  const rows: FmpCongressTrade[] = [];
  for (const chunk of chunks) {
    for (const row of chunk) {
      const key = `${row.transactionDate}|${row.disclosureDate}|${row.symbol}|${row.firstName}|${row.lastName}|${row.type}|${row.amount}`;
      if (seen.has(key)) continue;
      seen.add(key);
      rows.push(row);
    }
  }
  return withChamber(rows, chamber);
}

export async function loadSymbolCongressTrades(symbol: string, limit = 60) {
  return (await loadSymbolCongressTradesArchive(symbol)).slice(0, limit);
}

export async function loadSymbolCongressTradesArchive(symbol: string) {
  const [senatePages, housePages] = await Promise.all([
    Promise.all(Array.from({ length: 4 }, (_, page) => getSenateTrades(symbol, 100, page))),
    Promise.all(Array.from({ length: 6 }, (_, page) => getHouseTrades(symbol, 100, page))),
  ]);
  return sortCongressTrades([
    ...withChamber(mergeSymbolCongressPages(senatePages), "Senate"),
    ...withChamber(mergeSymbolCongressPages(housePages), "House"),
  ]);
}

function mergeSymbolCongressPages(pages: FmpCongressTrade[][]) {
  const seen = new Set<string>();
  const rows: FmpCongressTrade[] = [];
  for (const chunk of pages) {
    for (const row of chunk) {
      const key = `${row.transactionDate}|${row.disclosureDate}|${row.symbol}|${row.firstName}|${row.lastName}|${row.type}|${row.amount}|${row.link}`;
      if (seen.has(key)) continue;
      seen.add(key);
      rows.push(row);
    }
  }
  return rows;
}

function nameQueryFromSlug(slug: string) {
  const parts = slugifyPolitician(slug).split("-").filter(Boolean);
  const last = parts[parts.length - 1] || slug;
  const token = last.length >= 3 ? last : parts.join("");
  return token.charAt(0).toUpperCase() + token.slice(1);
}

function rowMatchesSlug(row: FmpCongressTrade, slug: string) {
  const full = politicianSlug(row);
  const last = slugifyPolitician(row.lastName || "");
  return full === slug || last === slug;
}

export const loadPoliticianTrades = cache(async (slug: string) => {
  const normalized = slugifyPolitician(slug);
  if (!normalized) return null;
  const query = nameQueryFromSlug(normalized);
  const [senate, house] = await Promise.all([getSenateTradesByName(query), getHouseTradesByName(query)]);
  const matched = sortCongressTrades([
    ...withChamber(senate, "Senate"),
    ...withChamber(house, "House"),
  ]).filter((row) => rowMatchesSlug(row, normalized));
  if (matched.length === 0) return null;

  const senateID = matched.find((row) => row.senateID)?.senateID;
  const [profile, positions, netWorth]: [
    FmpSenateProfile | null,
    FmpSenatePosition[],
    FmpSenateNetWorth[],
  ] = senateID
    ? await Promise.all([
        getSenateProfile(senateID),
        getSenatePositions(senateID),
        getSenateNetWorthArchive(senateID),
      ])
    : [null, [], []];
  return {
    slug: normalized,
    name: politicianName(matched[0]),
    rows: matched,
    profile,
    positions,
    netWorth,
  };
});

export function uniquePoliticians(rows: CongressTradeRow[], limit = 12) {
  const seen = new Set<string>();
  const people: { href: string; name: string }[] = [];
  for (const row of rows) {
    const href = politicianHref(row);
    if (seen.has(href)) continue;
    seen.add(href);
    people.push({ href, name: politicianName(row) });
    if (people.length >= limit) break;
  }
  return people;
}
