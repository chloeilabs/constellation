export const TABLE_PAGE_SIZE = 50;
export const HOLDINGS_PAGE_SIZE = 100;
export const NEWS_PAGE_SIZE = 20;

export function pageNumber(value?: string) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) return 1;
  return parsed;
}

export function pageWindow(total: number, page: number, size = TABLE_PAGE_SIZE) {
  const pageCount = Math.max(1, Math.ceil(total / size) || 1);
  const current = Math.min(Math.max(page, 1), pageCount);
  const start = total === 0 ? 0 : (current - 1) * size;
  const end = Math.min(start + size, total);
  return {
    page: current,
    pageCount,
    total,
    from: total === 0 ? 0 : start + 1,
    to: end,
    start,
  };
}

export function paginate<T>(rows: T[], page: number, size = TABLE_PAGE_SIZE) {
  const window = pageWindow(rows.length, page, size);
  return {
    rows: rows.slice(window.start, window.start + size),
    page: window.page,
    pageCount: window.pageCount,
    total: window.total,
    from: window.from,
    to: window.to,
  };
}

export function pageHref(path: string, page: number, extra: Record<string, string | undefined> = {}) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(extra)) {
    if (value) params.set(key, value);
  }
  if (page > 1) params.set("page", String(page));
  const query = params.toString();
  return query ? `${path}?${query}` : path;
}

export function pagerLinks(
  path: string,
  page: number,
  pageCount: number,
  extra: Record<string, string | undefined> = {},
) {
  const href = (nextPage: number) => pageHref(path, nextPage, extra);
  return {
    firstHref: page > 1 ? href(1) : undefined,
    prevHref: page > 1 ? href(page - 1) : undefined,
    nextHref: page < pageCount ? href(page + 1) : undefined,
    lastHref: page < pageCount ? href(pageCount) : undefined,
  };
}
