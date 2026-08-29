import Link from "next/link";
import { cn } from "@/lib/utils";

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
  total?: number;
  page: number;
  pageCount?: number;
  prevHref?: string;
  nextHref?: string;
  firstHref?: string;
  lastHref?: string;
}) {
  if ((total != null && total === 0) || (total == null && to === 0)) return null;
  const showNav = (pageCount != null && pageCount > 1) || Boolean(prevHref || nextHref);
  return (
    <nav aria-label="Table pages" className="mt-3 flex flex-wrap items-center justify-between gap-2 text-sm">
      <p className="text-muted">
        Showing {from.toLocaleString("en-US")}–{to.toLocaleString("en-US")}
        {total != null ? ` of ${total.toLocaleString("en-US")}` : ""}
      </p>
      {showNav ? (
        <div className="flex items-center gap-1">
          {firstHref && page > 1 ? <PagerLink href={firstHref}>First</PagerLink> : null}
          {prevHref ? (
            <PagerLink href={prevHref}>Previous</PagerLink>
          ) : (
            <span className="px-2 py-1 text-muted">Previous</span>
          )}
          <span className="tabular px-2 text-muted" aria-current="page">
            Page {page.toLocaleString("en-US")}
            {pageCount != null ? ` of ${pageCount.toLocaleString("en-US")}` : ""}
          </span>
          {nextHref ? <PagerLink href={nextHref}>Next</PagerLink> : <span className="px-2 py-1 text-muted">Next</span>}
          {lastHref && pageCount != null && page < pageCount ? <PagerLink href={lastHref}>Last</PagerLink> : null}
        </div>
      ) : null}
    </nav>
  );
}

function PagerLink({ href, children }: { href: string; children: string }) {
  return (
    <Link
      href={href}
      scroll={false}
      className={cn("sa-btn sa-btn-secondary h-8 px-2.5 text-xs font-medium")}
    >
      {children}
    </Link>
  );
}
