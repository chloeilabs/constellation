import { getDelistedCompanies, getIpos, getLatestMergers, getSplitsCalendar, getSymbolChanges } from "@/lib/fmp";
import { isForeignListingSymbol, isUsVenue } from "@/lib/listings";
import { addDays, isoDate, nyDateString } from "@/lib/utils";
import type { FmpDelisted, FmpIpo, FmpMerger, FmpSplit, FmpSymbolChange } from "@/lib/types";

export type CorporateActionType = "Stock Split" | "Symbol Change" | "Delisted" | "Listed" | "Acquisition";

export type CorporateAction = {
  date: string;
  symbol: string;
  type: CorporateActionType;
  action: string;
};

const DELISTED_PAGES = 4;
const MERGER_LIMIT = 100;

function usTicker(symbol?: string | null) {
  return Boolean(symbol) && !isForeignListingSymbol(symbol!);
}

function inWindow(date: string | null | undefined, from: string, to: string) {
  if (!date) return false;
  const day = date.slice(0, 10);
  return day >= from && day <= to;
}

function splitAction(row: FmpSplit) {
  const reverse = row.numerator < row.denominator || /reverse/i.test(row.splitType || "");
  return `${row.symbol} ${reverse ? "reverse stock split" : "stock split"}: ${row.numerator} for ${row.denominator}`;
}

function changeAction(row: FmpSymbolChange) {
  return `${row.oldSymbol} ticker symbol changed to ${row.newSymbol}`;
}

function delistedAction(row: FmpDelisted) {
  return `${row.companyName || row.symbol} was delisted`;
}

function listedAction(row: FmpIpo) {
  return `${row.company || row.symbol} was listed`;
}

function acquisitionAction(row: FmpMerger) {
  const target = row.targetedSymbol || row.targetedCompanyName || "Target";
  const buyer = row.symbol || row.companyName || "acquirer";
  return `${target} was acquired by ${buyer}`;
}

export async function loadCorporateActions() {
  const today = nyDateString();
  const from = isoDate(addDays(new Date(`${today}T00:00:00Z`), -100));
  const to = isoDate(addDays(new Date(`${today}T00:00:00Z`), 14));
  const [splits, changes, delistedPages, mergers, ipos] = await Promise.all([
    getSplitsCalendar(from, to),
    getSymbolChanges(),
    Promise.all(Array.from({ length: DELISTED_PAGES }, (_, page) => getDelistedCompanies(page, 100))),
    getLatestMergers(MERGER_LIMIT, 0),
    getIpos(from, to),
  ]);

  const rows: CorporateAction[] = [];
  const seen = new Set<string>();
  const pushUnique = (row: CorporateAction) => {
    const key = `${row.date}|${row.symbol}|${row.type}|${row.action}`;
    if (seen.has(key)) return;
    seen.add(key);
    rows.push(row);
  };

  for (const row of splits) {
    if (!usTicker(row.symbol) || !inWindow(row.date, from, to)) continue;
    pushUnique({
      date: row.date.slice(0, 10),
      symbol: row.symbol,
      type: "Stock Split",
      action: splitAction(row),
    });
  }

  for (const row of changes) {
    if (!usTicker(row.oldSymbol) || !usTicker(row.newSymbol) || !inWindow(row.date, from, to)) continue;
    pushUnique({
      date: row.date.slice(0, 10),
      symbol: row.newSymbol,
      type: "Symbol Change",
      action: changeAction(row),
    });
  }

  for (const row of delistedPages.flat()) {
    if (!usTicker(row.symbol) || !isUsVenue(row.exchange) || !inWindow(row.delistedDate, from, to)) continue;
    pushUnique({
      date: row.delistedDate.slice(0, 10),
      symbol: row.symbol,
      type: "Delisted",
      action: delistedAction(row),
    });
  }

  for (const row of mergers) {
    const symbol = row.targetedSymbol || row.symbol;
    if (!usTicker(symbol) || !inWindow(row.transactionDate, from, to)) continue;
    pushUnique({
      date: row.transactionDate.slice(0, 10),
      symbol,
      type: "Acquisition",
      action: acquisitionAction(row),
    });
  }

  for (const row of ipos) {
    if (!usTicker(row.symbol) || !/priced/i.test(row.actions || "") || !inWindow(row.date, from, to)) continue;
    pushUnique({
      date: row.date.slice(0, 10),
      symbol: row.symbol,
      type: "Listed",
      action: listedAction(row),
    });
  }

  rows.sort((left, right) => right.date.localeCompare(left.date) || left.symbol.localeCompare(right.symbol));
  return rows;
}
