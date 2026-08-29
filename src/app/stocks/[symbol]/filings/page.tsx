import Link from "next/link";
import { Container } from "@/components/container";
import { PageHeader } from "@/components/page-header";
import { SectionNav } from "@/components/section-nav";
import { TablePager } from "@/components/table-pager";
import { formatDate } from "@/lib/format";
import { getProfile, getSecFilingsArchive } from "@/lib/fmp";
import { secFormCategory, secFormTitle, sortSecFilings, type SecFilingCategory } from "@/lib/filings";
import { decodeTicker, displayCompanyName, stockPath } from "@/lib/listings";
import { quoteNewsNav } from "@/lib/nav";
import { pageHref, pageNumber, paginate } from "@/lib/paging";
import { cn, nyDateString } from "@/lib/utils";

const FILING_FILTERS: { id: SecFilingCategory; label: string }[] = [
  { id: "all", label: "All" },
  { id: "annual", label: "Annual" },
  { id: "quarterly", label: "Quarterly" },
  { id: "current", label: "Current" },
  { id: "proxy", label: "Proxy" },
];

function filingFilter(value?: string): SecFilingCategory {
  if (value === "annual" || value === "quarterly" || value === "current" || value === "proxy") return value;
  return "all";
}

export default async function StockFilingsPage({
  params,
  searchParams,
}: {
  params: Promise<{ symbol: string }>;
  searchParams: Promise<{ type?: string; page?: string }>;
}) {
  const { symbol } = await params;
  const { type: typeParam, page: pageParam } = await searchParams;
  const ticker = decodeTicker(symbol);
  const filter = filingFilter(typeParam);
  const to = nyDateString();
  const from = "1990-01-01";
  const [rows, profile] = await Promise.all([getSecFilingsArchive(ticker, from, to), getProfile(ticker)]);
  const ordered = sortSecFilings(rows);
  const filtered =
    filter === "all" ? ordered : ordered.filter((row) => secFormCategory(row.formType) === filter);
  const page = paginate(filtered, pageNumber(pageParam));
  const shortName = displayCompanyName(profile?.companyName) || ticker;
  const base = stockPath(ticker, "/filings");
  const typeQuery = filter === "all" ? undefined : filter;
  const filingsPageHref = (nextPage: number) => pageHref(base, nextPage, { type: typeQuery });

  return (
    <Container>
      <PageHeader
        title={`${shortName} Filings`}
        description="EDGAR filings from FMP, including annual reports, quarterly reports, current reports, and proxy statements. Form 4s are listed after the primary forms."
      />
      <SectionNav items={quoteNewsNav(ticker)} />
      <p className="mb-4 text-sm text-muted">
        Looking for as-filed 10-K / 10-Q packages?{" "}
        <Link href={stockPath(ticker, "/financials/reports")} className="text-link hover:underline">
          Open financial reports
        </Link>
        {" · "}
        <Link href={stockPath(ticker, "/financials/income-statement?source=reported")} className="text-link hover:underline">
          As-reported income statement
        </Link>
        .
      </p>
      <div className="mb-4 inline-flex rounded-md border border-border p-0.5 text-sm" role="group" aria-label="Filing type">
        {FILING_FILTERS.map((item) => {
          const href = item.id === "all" ? base : `${base}?type=${item.id}`;
          const active = filter === item.id;
          return (
            <Link
              key={item.id}
              href={href}
              scroll={false}
              className={cn(
                "rounded px-3 py-1.5 font-medium",
                active ? "bg-brand text-white" : "text-muted hover:text-header",
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="sa-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Form</th>
              <th>Document</th>
            </tr>
          </thead>
          <tbody>
            {page.rows.length === 0 ? (
              <tr>
                <td colSpan={3} className="text-muted">
                  No SEC filings in this category.
                </td>
              </tr>
            ) : (
              page.rows.map((row) => (
                <tr key={`${row.formType}-${row.acceptedDate}-${row.link}`}>
                  <td>{formatDate(row.filingDate)}</td>
                  <td className="font-medium">{row.formType}</td>
                  <td>
                    <a
                      href={row.finalLink || row.link}
                      className="text-link hover:underline"
                      target="_blank"
                      rel="noreferrer"
                    >
                      {secFormTitle(row.formType)}
                    </a>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <TablePager
        from={page.from}
        to={page.to}
        total={page.total}
        page={page.page}
        pageCount={page.pageCount}
        firstHref={page.page > 1 ? filingsPageHref(1) : undefined}
        prevHref={page.page > 1 ? filingsPageHref(page.page - 1) : undefined}
        nextHref={page.page < page.pageCount ? filingsPageHref(page.page + 1) : undefined}
        lastHref={page.page < page.pageCount ? filingsPageHref(page.pageCount) : undefined}
      />
    </Container>
  );
}
