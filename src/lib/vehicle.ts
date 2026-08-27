import { decodeTicker } from "@/lib/listings";

export type VehicleKind = "etf" | "fund";

export function vehicleBase(kind: VehicleKind) {
  return kind === "etf" ? "/etf" : "/funds";
}

export function vehiclePath(kind: VehicleKind, symbol: string, suffix = "") {
  return `${vehicleBase(kind)}/${decodeTicker(symbol)}${suffix}`;
}

export function vehicleNoun(kind: VehicleKind) {
  return kind === "etf" ? "ETF" : "fund";
}
