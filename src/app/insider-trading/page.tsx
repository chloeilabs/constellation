import Link from "next/link";
import { Container } from "@/components/container";
import { InsiderTable } from "@/components/insider-table";
import { PageHeader } from "@/components/page-header";
import { SectionNav } from "@/components/section-nav";
import { TablePager } from "@/components/table-pager";
import { CONGRESS_NAV } from "@/lib/nav";
import { getInsiderReportingNames, getLatestInsiderTradesArchive, searchInsiderTradesArchive } from "@/lib/fmp";
import { padCik } from "@/lib/institutional";
import { isForeignListingSymbol } from "@/lib/listings";
import { TABLE_PAGE_SIZE, pageNumber, paginate, pagerLinks } from "@/lib/paging";
import { cn } from "@/lib/utils";

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ name?: string; cik?: string }>;
}) {
  const { name, cik } = await searchParams;
  const queryName = (name ?? "").trim();
  if (queryName) {
    return {
      title: `Insider Trading: ${queryName}`,
      description: `Form 4 filings for insiders matching “${queryName}”.`,
    };
  }
  if (cik) {
    return {
      title: `Insider Trading: CIK ${padCik(cik)}`,
      description: `Form 4 filings reported under CIK ${padCik(cik)}.`,
    };
  }
  return {
    title: "Insider Trading",
    description: "The latest Form 4 filings from officers, directors, and major shareholders.",
  };
}

export default async function InsiderTradingPage({
  searchParams,
}: {
  searchParams: Promise<{ name?: string; cik?: string; page?: string }>;
}) {
  const { name, cik, page: pageParam } = await searchParams;
  const queryName = (name ?? "").trim();
  const queryCik = padCik(cik ?? "");
  const people = queryName ? await getInsiderReportingNames(queryName) : [];
  const uniquePeople = [...new Map(people.map((person) => [padCik(person.reportingCik), person])).values()].filter(
    (person) => padCik(person.reportingCik),
  );
  const selectedCik = queryCik || (uniquePeople[0] ? padCik(uniquePeople[0].reportingCik) : "");
  const selectedPerson =
    uniquePeople.find((person) => padCik(person.reportingCik) === selectedCik) ?? uniquePeople[0] ?? null;
  const trades = selectedCik
    ? await searchInsiderTradesArchive(selectedCik)
    : await getLatestInsiderTradesArchive();
  const rows = selectedCik ? trades : trades.filter((row) => !isForeignListingSymbol(row.symbol));
  const feed = paginate(rows, pageNumber(pageParam), TABLE_PAGE_SIZE);
  const personName = selectedPerson?.reportingName || rows[0]?.reportingName || null;
  const searching = Boolean(queryName || queryCik);
  const extra = {
    name: queryName || undefined,
    cik: selectedCik && searching ? selectedCik : undefined,
  };

  return (
    <Container>
      <PageHeader
        title={personName && searching ? `Insider Trading — ${personName}` : "Insider Trading"}
        description={
          searching
            ? "Form 4 purchases, sales, gifts, and conversions for this reporting person from live FMP insider filings."
            : "The latest Form 4 filings from officers, directors, and major shareholders."
        }
      />
      <SectionNav items={CONGRESS_NAV} />
      <form className="mb-6 flex max-w-xl flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center" action="/insider-trading">
        <input
          name="name"
          defaultValue={queryName}
          placeholder="Insider last name (e.g. Zuckerberg)"
          className="sa-input min-w-0 w-full flex-1 sm:min-w-[16rem]"
        />
        <button type="submit" className="sa-btn sa-btn-primary">
          Search
        </button>
        {searching ? (
          <Link href="/insider-trading" className="text-sm text-link hover:underline">
            Latest filings
          </Link>
        ) : null}
      </form>
      {queryName && uniquePeople.length === 0 ? (
        <p className="mb-4 text-sm text-muted">No reporting persons matched “{queryName}”.</p>
      ) : null}
      {uniquePeople.length > 1 ? (
        <div className="mb-4 flex flex-wrap gap-2">
          {uniquePeople.map((person) => {
            const personCik = padCik(person.reportingCik);
            const active = personCik === selectedCik;
            const href = `/insider-trading?name=${encodeURIComponent(queryName)}&cik=${personCik}`;
            return (
              <Link
                key={personCik}
                href={href}
                className={cn(
                  "rounded-full px-3 py-1 text-sm font-medium",
                  active ? "bg-brand text-white" : "bg-chip text-header hover:bg-border",
                )}
              >
                {person.reportingName}
              </Link>
            );
          })}
        </div>
      ) : null}
      <InsiderTable
        rows={feed.rows}
        empty={searching ? "No Form 4 filings found for this insider." : "No insider trades in this window."}
      />
      <TablePager
        from={feed.from}
        to={feed.to}
        total={feed.total}
        page={feed.page}
        pageCount={feed.pageCount}
        {...pagerLinks("/insider-trading", feed.page, feed.pageCount, extra)}
      />
    </Container>
  );
}
