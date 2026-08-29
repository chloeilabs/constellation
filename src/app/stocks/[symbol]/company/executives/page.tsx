import Link from "next/link";
import { Container } from "@/components/container";
import { CompanyPeople } from "@/components/company-people";
import { PageHeader } from "@/components/page-header";
import { SectionNav } from "@/components/section-nav";
import { getExecutiveCompensation, getKeyExecutives, getProfile } from "@/lib/fmp";
import { decodeTicker, stockPath } from "@/lib/listings";
import { companyNav } from "@/lib/nav";
import { cn } from "@/lib/utils";

export default async function CompanyExecutivesPage({
  params,
  searchParams,
}: {
  params: Promise<{ symbol: string }>;
  searchParams: Promise<{ year?: string }>;
}) {
  const { symbol } = await params;
  const { year: yearParam } = await searchParams;
  const ticker = decodeTicker(symbol);
  const [profile, executives, compensation] = await Promise.all([
    getProfile(ticker),
    getKeyExecutives(ticker),
    getExecutiveCompensation(ticker),
  ]);
  const people = executives.filter((person) => person.active !== false);
  const years = [...new Set(compensation.map((row) => row.year).filter((year) => year > 0))].sort((a, b) => b - a);
  const latestYear = years[0] ?? 0;
  const requested = Number(yearParam);
  const year = years.includes(requested) ? requested : latestYear;
  const pay = compensation.filter((row) => row.year === year).sort((a, b) => (b.total ?? 0) - (a.total ?? 0));
  const base = stockPath(ticker, "/company/executives");

  return (
    <Container>
      <PageHeader
        title={`${profile?.companyName ?? ticker} Executives`}
        description="Key executives and reported compensation from FMP proxy filings."
      />
      <SectionNav items={companyNav(ticker)} />
      {years.length > 1 ? (
        <div className="mb-5 flex flex-wrap gap-2" role="group" aria-label="Compensation year">
          {years.map((value) => (
            <Link
              key={value}
              href={value === latestYear ? base : `${base}?year=${value}`}
              scroll={false}
              className={cn(
                "rounded-full px-3 py-1 text-sm font-medium",
                value === year ? "bg-brand text-white" : "bg-chip text-header hover:bg-border",
              )}
            >
              {value}
            </Link>
          ))}
        </div>
      ) : null}
      <CompanyPeople executives={people} compensation={pay} year={year} />
    </Container>
  );
}
