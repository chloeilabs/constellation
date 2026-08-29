import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { formatRelativeTime } from "@/lib/format";
import { quoteHref } from "@/lib/listings";
import type { FmpNewsItem } from "@/lib/types";
import { EmptyState } from "@/components/container";

export function NewsList({
  items,
  showSymbol = true,
}: {
  items: FmpNewsItem[];
  showSymbol?: boolean;
}) {
  if (items.length === 0) {
    return <EmptyState title="No news" message="There are no headlines in this window yet." />;
  }

  return (
    <ul className="divide-y divide-border rounded-lg border border-border">
      {items.map((item, index) => (
        <li key={`${item.url}-${index}`} className="flex gap-4 px-3 py-3 first:rounded-t-lg last:rounded-b-lg hover:bg-muted-bg/70">
          <div className="w-12 shrink-0 pt-0.5 text-xs text-muted">{formatRelativeTime(item.publishedDate)}</div>
          {item.image ? (
            // News thumbnails come from many publisher CDNs.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={item.image}
              alt=""
              width={96}
              height={64}
              className="hidden h-16 w-24 shrink-0 rounded object-cover bg-muted-bg sm:block"
            />
          ) : null}
          <div className="min-w-0">
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-start gap-1.5 font-medium text-header hover:text-link"
            >
              <span>{item.title}</span>
              <ExternalLink className="mt-1 h-3.5 w-3.5 shrink-0 text-muted" aria-hidden="true" />
              <span className="sr-only">(opens in a new tab)</span>
            </a>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted">
              {showSymbol && item.symbol ? (
                <Link href={quoteHref(item.symbol, { name: item.title })} className="font-semibold text-link hover:underline">
                  {item.symbol}
                </Link>
              ) : null}
              <span>{item.publisher || item.site}</span>
            </div>
            {item.text ? <p className="mt-1 line-clamp-2 text-sm text-muted">{item.text}</p> : null}
          </div>
        </li>
      ))}
    </ul>
  );
}
