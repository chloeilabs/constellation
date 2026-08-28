import type { FmpNewsItem } from "@/lib/types";

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
