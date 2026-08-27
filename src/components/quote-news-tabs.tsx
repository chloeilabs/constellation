"use client";

import { useState } from "react";
import Link from "next/link";
import { NewsList } from "@/components/news-list";
import { formatDate } from "@/lib/format";
import { stockPath } from "@/lib/listings";
import { cn } from "@/lib/utils";
import type { FmpNewsItem, FmpSecFiling, FmpTranscriptDate } from "@/lib/types";

type TabId = "all" | "press" | "transcripts" | "filings";

const TABS: { id: TabId; label: string }[] = [
  { id: "all", label: "All" },
  { id: "press", label: "Press Releases" },
  { id: "transcripts", label: "Transcripts" },
  { id: "filings", label: "Filings" },
];

export function QuoteNewsTabs({
  symbol,
  news,
  press,
  transcripts,
  filings,
}: {
  symbol: string;
  news: FmpNewsItem[];
  press: FmpNewsItem[];
  transcripts: FmpTranscriptDate[];
  filings: FmpSecFiling[];
}) {
  const [tab, setTab] = useState<TabId>("all");
  const moreHref = {
    all: stockPath(symbol, "/news"),
    press: stockPath(symbol, "/news/press-releases"),
    transcripts: stockPath(symbol, "/transcripts"),
    filings: stockPath(symbol, "/filings"),
  }[tab];
  const moreLabel = {
    all: "All news",
    press: "All press releases",
    transcripts: "All transcripts",
    filings: "All filings",
  }[tab];

  return (
    <section className="mt-10">
      <div className="mb-3 flex items-end justify-between gap-3">
        <h2 className="text-xl font-semibold text-header">News</h2>
        <Link href={moreHref} className="text-sm text-link hover:underline">
          {moreLabel}
        </Link>
      </div>
      <div className="mb-4 flex flex-wrap gap-2" role="tablist" aria-label="Quote news">
        {TABS.map((item) => {
          const selected = item.id === tab;
          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => setTab(item.id)}
              className={cn(
                "rounded-full px-3 py-1 text-sm font-medium",
                selected ? "bg-header text-white" : "bg-chip text-header hover:bg-border",
              )}
            >
              {item.label}
            </button>
          );
        })}
      </div>
      {tab === "all" ? <NewsList items={news} showSymbol={false} /> : null}
      {tab === "press" ? <NewsList items={press} showSymbol={false} /> : null}
      {tab === "transcripts" ? <TranscriptList symbol={symbol} rows={transcripts} /> : null}
      {tab === "filings" ? <FilingList rows={filings} /> : null}
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
              <div className="font-medium text-header">{row.formType}</div>
              <div className="mt-1 text-xs text-muted">{formatDate(row.acceptedDate || row.filingDate)}</div>
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
