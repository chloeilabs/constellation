import Link from "next/link";
import { Container } from "@/components/container";
import { PageHeader } from "@/components/page-header";
import { SectionNav } from "@/components/section-nav";
import { formatDate } from "@/lib/format";
import { getProfile, getSecFilings } from "@/lib/fmp";
import { secFormCategory, secFormTitle, sortSecFilings, type SecFilingCategory } from "@/lib/filings";
import { decodeTicker, displayCompanyName, stockPath } from "@/lib/listings";
import { quoteNewsNav } from "@/lib/nav";
import { addDays, cn, isoDate, nyDateString } from "@/lib/utils";

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
  searchParams: Promise<{ type?: string }>;
}) {
  const { symbol } = await params;
  const { type: typeParam } = await searchParams;
  const ticker = decodeTicker(symbol);
  const filter = filingFilter(typeParam);
  const to = nyDateString();
  const from = isoDate(addDays(new Date(`${to}T00:00:00Z`), -540));
  const [rows, profile] = await Promise.all([getSecFilings(ticker, from, to, 80), getProfile(ticker)]);
  const ordered = sortSecFilings(rows);
  const filtered =
    filter === "all" ? ordered : ordered.filter((row) => secFormCategory(row.formType) === filter);
  const shown = filtered.slice(0, 60);
  const shortName = displayCompanyName(profile?.companyName) || ticker;
  const base = stockPath(ticker, "/filings");

  return (
    <Container>
      <PageHeader
        title={`${shortName} Filings`}
        description="Recent EDGAR filings including annual reports, quarterly reports, current reports, and proxy statements."
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
                active ? "bg-header text-on-header" : "text-muted hover:text-header",
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
            {shown.length === 0 ? (
              <tr>
                <td colSpan={3} className="text-muted">
                  No SEC filings in this category for the last 18 months.
                </td>
              </tr>
            ) : (
              shown.map((row) => (
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
    </Container>
  );
}
