import { cache } from "react";
import {
  getHouseLatest,
  getHouseTrades,
  getHouseTradesByName,
  getSenateLatest,
  getSenateProfile,
  getSenateTrades,
  getSenateTradesByName,
} from "@/lib/fmp";
import { isForeignListingSymbol } from "@/lib/listings";
import type { FmpCongressTrade, FmpSenateProfile } from "@/lib/types";

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
  if (chamber === "senate") {
    return sortCongressTrades(withChamber(await getSenateLatest(limit), "Senate")).slice(0, limit);
  }
  if (chamber === "house") {
    return sortCongressTrades(withChamber(await getHouseLatest(limit), "House")).slice(0, limit);
  }
  const [senate, house] = await Promise.all([getSenateLatest(limit), getHouseLatest(limit)]);
  return sortCongressTrades([...withChamber(senate, "Senate"), ...withChamber(house, "House")]).slice(0, limit);
}

export async function loadSymbolCongressTrades(symbol: string, limit = 60) {
  const [senate, house] = await Promise.all([getSenateTrades(symbol, limit), getHouseTrades(symbol, limit)]);
  return sortCongressTrades([...withChamber(senate, "Senate"), ...withChamber(house, "House")]).slice(0, limit);
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
  const profile: FmpSenateProfile | null = senateID ? await getSenateProfile(senateID) : null;
  return {
    slug: normalized,
    name: politicianName(matched[0]),
    rows: matched.slice(0, 200),
    profile,
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
