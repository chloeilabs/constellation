import { getIpoProspectuses, getIpos, getQuotes } from "@/lib/fmp";
import { addDays, isoDate, nyDateString } from "@/lib/utils";

export function parseIpoPrice(priceRange: string | null | undefined) {
  if (!priceRange) return null;
  const nums = [...priceRange.matchAll(/[0-9]+(?:\.[0-9]+)?/g)]
    .map((match) => Number(match[0]))
    .filter((value) => Number.isFinite(value) && value > 0 && value < 100_000);
  if (nums.length === 0) return null;
  if (nums.length === 1) return nums[0];
  return (nums[0] + nums[1]) / 2;
}

export function plausibleIpoPrice(ipoPrice: number, current: number | null | undefined) {
  if (!Number.isFinite(ipoPrice) || ipoPrice <= 0) return false;
  if (current == null || current <= 0) return ipoPrice < 1000;
  const ratio = current / ipoPrice;
  return ratio > 0.04 && ratio < 25;
}

export async function loadRecentPricedIpos(limit = 200) {
  const today = new Date(`${nyDateString()}T00:00:00Z`);
  const windows = [0, 180, 360].map((offset) => {
    const to = isoDate(addDays(today, -offset));
    const from = isoDate(addDays(today, -(offset + 180)));
    return Promise.all([getIpos(from, to), getIpoProspectuses(from, to)]);
  });
  const chunks = await Promise.all(windows);
  const calendar = chunks.flatMap(([rows]) => rows);
  const prospectuses = chunks.flatMap(([, rows]) => rows);

  const prospectusPrice = new Map<string, number>();
  for (const row of prospectuses) {
    if (!row.symbol || row.pricePublicPerShare == null) continue;
    if (!prospectusPrice.has(row.symbol.toUpperCase())) {
      prospectusPrice.set(row.symbol.toUpperCase(), row.pricePublicPerShare);
    }
  }

  const priced = calendar.filter((row) => row.symbol && /priced/i.test(row.actions || ""));
  const bySymbol = new Map<string, (typeof priced)[number]>();
  for (const row of priced) {
    const key = row.symbol.toUpperCase();
    const existing = bySymbol.get(key);
    if (!existing || row.date > existing.date) bySymbol.set(key, row);
  }

  const unique = [...bySymbol.values()].sort((a, b) => b.date.localeCompare(a.date)).slice(0, limit);
  const quotes = await getQuotes(unique.map((row) => row.symbol));
  const quoteBySymbol = new Map(quotes.map((quote) => [quote.symbol, quote]));

  return unique.map((row) => {
    const quote = quoteBySymbol.get(row.symbol.toUpperCase());
    const fromRange = parseIpoPrice(row.priceRange);
    const fromProspectus = prospectusPrice.get(row.symbol.toUpperCase()) ?? null;
    const current = quote?.price ?? null;
    const ipoPrice =
      fromRange && plausibleIpoPrice(fromRange, current)
        ? fromRange
        : fromProspectus && plausibleIpoPrice(fromProspectus, current)
          ? fromProspectus
          : (fromRange ?? fromProspectus);
    const ipoReturn =
      ipoPrice && current && ipoPrice > 0 ? (current - ipoPrice) / ipoPrice : null;
    return {
      date: row.date,
      symbol: row.symbol.toUpperCase(),
      company: row.company,
      exchange: row.exchange,
      ipoPrice,
      current,
      ipoReturn,
      marketCap: quote?.marketCap ?? row.marketCap,
    };
  });
}
