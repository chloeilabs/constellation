import Link from "next/link";
import { Container } from "@/components/container";
import { PageHeader } from "@/components/page-header";
import { SectionNav } from "@/components/section-nav";
import { TablePager } from "@/components/table-pager";
import { formatDate } from "@/lib/format";
import { getLatestSecFilingsArchive } from "@/lib/fmp";
import { isPrimaryUsSymbol, quoteHref } from "@/lib/listings";
import { NEWS_NAV } from "@/lib/nav";
import { TABLE_PAGE_SIZE, pageNumber, paginate, pagerLinks } from "@/lib/paging";
import { addDays, cn, isoDate, nyDateString } from "@/lib/utils";
import type { FmpSecFiling } from "@/lib/types";

export const metadata = {
  title: "Latest SEC Filings",
  description: "Recent 8-K, 10-Q, and 10-K filings from U.S. companies.",
};

const VIEWS = [
  { id: "all", label: "All" },
  { id: "8k", label: "8-K" },
  { id: "financials", label: "10-Q / 10-K" },
] as const;

type FilingsView = (typeof VIEWS)[number]["id"];

function isEightK(row: FmpSecFiling) {
  return row.formType === "8-K" || row.formType === "8-K/A";
}

function isFinancial(row: FmpSecFiling) {
  return /^10-[KQ]/i.test(row.formType);
}

export default async function LatestFilingsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; type?: string }>;
}) {
  const { page: pageParam, type: typeParam } = await searchParams;
  const view: FilingsView = VIEWS.some((item) => item.id === typeParam) ? (typeParam as FilingsView) : "all";
  const to = nyDateString();
  const from = isoDate(addDays(new Date(`${to}T00:00:00Z`), -7));
  const raw = await getLatestSecFilingsArchive(from, to);
  const rows = raw.filter((row) => {
    if (!isPrimaryUsSymbol(row.symbol)) return false;
    if (view === "8k") return isEightK(row);
    if (view === "financials") return isFinancial(row);
    return isEightK(row) || isFinancial(row);
  });
  const feed = paginate(rows, pageNumber(pageParam), TABLE_PAGE_SIZE);
  const extra = { type: view === "all" ? undefined : view };

  return (
    <Container>
      <PageHeader
        title="Latest SEC Filings"
        description="8-K current reports and newly posted 10-Q / 10-K financials from the last week."
      />
      <SectionNav items={NEWS_NAV} />
      <div className="mb-5 flex flex-wrap gap-2">
        {VIEWS.map((item) => (
          <Link
            key={item.id}
            href={item.id === "all" ? "/news/filings" : `/news/filings?type=${item.id}`}
            scroll={false}
            className={cn(
              "rounded-full px-3 py-1 text-sm font-medium",
              item.id === view ? "bg-header text-on-header" : "bg-chip text-header hover:bg-border",
            )}
          >
            {item.label}
          </Link>
        ))}
      </div>
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="sa-table">
          <thead>
            <tr>
              <th>Accepted</th>
              <th>Symbol</th>
              <th>Form</th>
              <th>Filing</th>
            </tr>
          </thead>
          <tbody>
            {feed.rows.length === 0 ? (
              <tr>
                <td colSpan={4} className="text-muted">
                  No recent filings in this window.
                </td>
              </tr>
            ) : (
              feed.rows.map((row) => (
                <tr key={`${row.symbol}-${row.formType}-${row.acceptedDate}-${row.link}`}>
                  <td>{formatDate(row.acceptedDate || row.filingDate)}</td>
                  <td className="symbol">
                    <Link href={quoteHref(row.symbol)} className="text-link hover:underline">
                      {row.symbol}
                    </Link>
                  </td>
                  <td className="font-medium">{row.formType}</td>
                  <td>
                    {row.finalLink || row.link ? (
                      <a
                        href={row.finalLink || row.link}
                        className="text-link hover:underline"
                        target="_blank"
                        rel="noreferrer"
                      >
                        View filing
                      </a>
                    ) : (
                      "—"
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <TablePager
        from={feed.from}
        to={feed.to}
        total={feed.total}
        page={feed.page}
        pageCount={feed.pageCount}
        {...pagerLinks("/news/filings", feed.page, feed.pageCount, extra)}
      />
    </Container>
  );
}
