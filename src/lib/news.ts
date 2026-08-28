import type { FmpNewsItem } from "@/lib/types";

/** One FMP /news/stock call; AAPL at 200 is about two weeks of headlines. */
export const SYMBOL_NEWS_LIMIT = 200;
export const PRESS_RELEASE_LIMIT = 50;

export function mergeNews(...lists: FmpNewsItem[][]) {
  const seen = new Set<string>();
  const merged: FmpNewsItem[] = [];
  for (const item of lists.flat().sort((left, right) => right.publishedDate.localeCompare(left.publishedDate))) {
    const key = item.url || `${item.title}-${item.publishedDate}`;
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push(item);
  }
  return merged;
}
