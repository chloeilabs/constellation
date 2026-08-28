"use client";

import { useState } from "react";
import Link from "next/link";
import { NewsList } from "@/components/news-list";
import { formatDate } from "@/lib/format";
import { stockPath } from "@/lib/listings";
import { mergeNews } from "@/lib/news";
import { secFormTitle } from "@/lib/filings";
import { cn } from "@/lib/utils";
import type { FmpNewsItem, FmpSecFiling, FmpTranscriptDate } from "@/lib/types";

type TabId = "all" | "press" | "transcripts" | "filings";

export function QuoteNewsTabs({
  symbol,
  news,
  press,
  transcripts = [],
  filings = [],
  moreHref,
}: {
  symbol: string;
  news: FmpNewsItem[];
  press: FmpNewsItem[];
  transcripts?: FmpTranscriptDate[];
  filings?: FmpSecFiling[];
  moreHref?: Partial<Record<TabId, string>>;
}) {
  const tabs: { id: TabId; label: string }[] = [
    { id: "all", label: "All" },
    { id: "press", label: "Press Releases" },
    ...(transcripts.length ? [{ id: "transcripts" as const, label: "Transcripts" }] : []),
    ...(filings.length ? [{ id: "filings" as const, label: "Filings" }] : []),
  ];
  const [tab, setTab] = useState<TabId>("all");
  const active = tabs.some((item) => item.id === tab) ? tab : "all";
  const allItems = mergeNews(news, press).slice(0, Math.max(news.length, 12));
  const defaults: Record<TabId, string> = {
    all: stockPath(symbol, "/news"),
    press: stockPath(symbol, "/news/press-releases"),
    transcripts: stockPath(symbol, "/transcripts"),
    filings: stockPath(symbol, "/filings"),
  };
  const hrefs = { ...defaults, ...moreHref };
  const moreLabel = {
    all: "All news",
    press: "All press releases",
    transcripts: "All transcripts",
    filings: "All filings",
  }[active];

  return (
    <section className="mt-10">
      <div className="mb-3 flex items-end justify-between gap-3">
        <h2 className="text-xl font-semibold text-header">News</h2>
        <Link href={hrefs[active]} className="text-sm text-link hover:underline">
          {moreLabel}
        </Link>
      </div>
      <div className="mb-4 flex flex-wrap gap-2" role="tablist" aria-label="Quote news">
        {tabs.map((item) => {
          const selected = item.id === active;
          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => setTab(item.id)}
              className={cn(
                "rounded-full px-3 py-1 text-sm font-medium",
                selected ? "bg-header text-on-header" : "bg-chip text-header hover:bg-border",
              )}
            >
              {item.label}
            </button>
          );
        })}
      </div>
      {active === "all" ? <NewsList items={allItems} showSymbol={false} /> : null}
      {active === "press" ? <NewsList items={press} showSymbol={false} /> : null}
      {active === "transcripts" ? <TranscriptList symbol={symbol} rows={transcripts} /> : null}
      {active === "filings" ? <FilingList rows={filings} /> : null}
    </section>
  );
}

function TranscriptList({ symbol, rows }: { symbol: string; rows: FmpTranscriptDate[] }) {
  if (rows.length === 0) {
    return <p className="text-sm text-muted">No earnings transcripts available.</p>;
  }
  return (
    <ul className="divide-y divide-border">
      {rows.map((row) => (
        <li key={`${row.fiscalYear}-${row.quarter}-${row.date}`} className="flex items-center justify-between gap-4 py-3">
          <div>
            <Link
              href={`${stockPath(symbol, "/transcripts")}?year=${row.fiscalYear}&quarter=${row.quarter}`}
              className="font-medium text-header hover:text-link"
            >
              Q{row.quarter} FY{row.fiscalYear} earnings call
            </Link>
            <div className="mt-1 text-xs text-muted">{formatDate(row.date)}</div>
          </div>
          <Link
            href={`${stockPath(symbol, "/transcripts")}?year=${row.fiscalYear}&quarter=${row.quarter}`}
            className="shrink-0 text-sm text-link hover:underline"
          >
            Read
          </Link>
        </li>
      ))}
    </ul>
  );
}

function FilingList({ rows }: { rows: FmpSecFiling[] }) {
  if (rows.length === 0) {
    return <p className="text-sm text-muted">No recent SEC filings.</p>;
  }
  return (
    <ul className="divide-y divide-border">
      {rows.map((row) => {
        const href = row.finalLink || row.link;
        return (
          <li
            key={`${row.formType}-${row.acceptedDate || row.filingDate}-${row.link}`}
            className="flex items-center justify-between gap-4 py-3"
          >
            <div>
              <div className="font-medium text-header">{secFormTitle(row.formType)}</div>
              <div className="mt-1 text-xs text-muted">
                {row.formType} · {formatDate(row.acceptedDate || row.filingDate)}
              </div>
            </div>
            {href ? (
              <a href={href} className="shrink-0 text-sm text-link hover:underline" target="_blank" rel="noreferrer">
                View filing
              </a>
            ) : (
              <span className="text-sm text-muted">—</span>
            )}
          </li>
        );
      })}
    </ul>
  );
}
