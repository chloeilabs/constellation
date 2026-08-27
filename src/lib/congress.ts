import { getHouseLatest, getHouseTrades, getSenateLatest, getSenateTrades } from "@/lib/fmp";
import { isForeignListingSymbol } from "@/lib/listings";
import type { FmpCongressTrade } from "@/lib/types";

export type CongressChamber = "all" | "senate" | "house";

export type CongressTradeRow = FmpCongressTrade & {
  chamber: "Senate" | "House";
};

export function politicianName(row: Pick<FmpCongressTrade, "firstName" | "lastName" | "office">) {
  const name = `${row.firstName || ""} ${row.lastName || ""}`.trim();
  return name || row.office || "—";
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
