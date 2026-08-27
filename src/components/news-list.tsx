import Link from "next/link";
import { formatRelativeTime } from "@/lib/format";
import { quoteHref } from "@/lib/listings";
import type { FmpNewsItem } from "@/lib/types";

export function NewsList({
  items,
  showSymbol = true,
}: {
  items: FmpNewsItem[];
  showSymbol?: boolean;
}) {
  if (items.length === 0) {
    return <p className="text-sm text-muted">No news available.</p>;
  }

  return (
    <ul className="divide-y divide-border">
      {items.map((item, index) => (
        <li key={`${item.url}-${index}`} className="flex gap-4 py-3">
          <div className="w-12 shrink-0 pt-0.5 text-xs text-muted">{formatRelativeTime(item.publishedDate)}</div>
          {item.image ? (
            // News thumbnails come from many publisher CDNs.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={item.image}
              alt=""
              className="h-16 w-24 shrink-0 rounded object-cover bg-muted-bg"
            />
          ) : null}
          <div className="min-w-0">
            <a href={item.url} target="_blank" rel="noreferrer" className="font-medium text-header hover:text-link">
              {item.title}
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
