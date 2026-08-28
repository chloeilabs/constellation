import Link from "next/link";

export function TablePager({
  from,
  to,
  total,
  page,
  pageCount,
  prevHref,
  nextHref,
  firstHref,
  lastHref,
}: {
  from: number;
  to: number;
  total: number;
  page: number;
  pageCount: number;
  prevHref?: string;
  nextHref?: string;
  firstHref?: string;
  lastHref?: string;
}) {
  if (total === 0) return null;
  return (
    <nav aria-label="Table pages" className="mt-3 flex flex-wrap items-center justify-between gap-2 text-sm">
      <p className="text-muted">
        Showing {from.toLocaleString("en-US")}–{to.toLocaleString("en-US")} of {total.toLocaleString("en-US")}
      </p>
      {pageCount > 1 ? (
        <div className="flex items-center gap-2">
          {firstHref && page > 1 ? (
            <Link href={firstHref} scroll={false} className="text-link hover:underline">
              First
            </Link>
          ) : null}
          {prevHref ? (
            <Link href={prevHref} scroll={false} className="text-link hover:underline">
              Previous
            </Link>
          ) : (
            <span className="text-muted">Previous</span>
          )}
          <span className="tabular text-muted">
            Page {page} of {pageCount.toLocaleString("en-US")}
          </span>
          {nextHref ? (
            <Link href={nextHref} scroll={false} className="text-link hover:underline">
              Next
            </Link>
          ) : (
            <span className="text-muted">Next</span>
          )}
          {lastHref && page < pageCount ? (
            <Link href={lastHref} scroll={false} className="text-link hover:underline">
              Last
            </Link>
          ) : null}
        </div>
      ) : null}
    </nav>
  );
}
