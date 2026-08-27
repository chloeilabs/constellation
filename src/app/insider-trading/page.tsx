import Link from "next/link";
import { Container } from "@/components/container";
import { InsiderTable } from "@/components/insider-table";
import { PageHeader } from "@/components/page-header";
import { SectionNav } from "@/components/section-nav";
import { CONGRESS_NAV } from "@/lib/nav";
import { getInsiderReportingNames, getLatestInsiderTrades, searchInsiderTrades } from "@/lib/fmp";
import { padCik } from "@/lib/institutional";
import { isForeignListingSymbol } from "@/lib/listings";
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
  searchParams: Promise<{ name?: string; cik?: string }>;
}) {
  const { name, cik } = await searchParams;
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
    ? await searchInsiderTrades({ reportingCik: selectedCik, limit: 100 })
    : await getLatestInsiderTrades(100);
  const rows = selectedCik ? trades : trades.filter((row) => !isForeignListingSymbol(row.symbol));
  const personName = selectedPerson?.reportingName || rows[0]?.reportingName || null;
  const searching = Boolean(queryName || queryCik);

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
      <form className="mb-6 flex max-w-xl flex-wrap items-center gap-2" action="/insider-trading">
        <input
          name="name"
          defaultValue={queryName}
          placeholder="Insider last name (e.g. Zuckerberg)"
          className="h-9 min-w-[16rem] flex-1 rounded-md border border-border bg-background px-3 text-sm outline-none ring-brand/30 placeholder:text-muted focus:ring-2"
        />
        <button type="submit" className="h-9 rounded-md bg-header px-3 text-sm font-semibold text-on-header">
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
                  active ? "bg-header text-on-header" : "bg-chip text-header hover:bg-border",
                )}
              >
                {person.reportingName}
              </Link>
            );
          })}
        </div>
      ) : null}
      <InsiderTable
        rows={rows.slice(0, 75)}
        empty={searching ? "No Form 4 filings found for this insider." : "No insider trades in this window."}
      />
    </Container>
  );
}
