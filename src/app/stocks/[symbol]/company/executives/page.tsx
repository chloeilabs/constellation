import { Container } from "@/components/container";
import { CompanyPeople } from "@/components/company-people";
import { PageHeader } from "@/components/page-header";
import { SectionNav } from "@/components/section-nav";
import { getExecutiveCompensation, getKeyExecutives, getProfile } from "@/lib/fmp";
import { decodeTicker } from "@/lib/listings";
import { companyNav } from "@/lib/nav";

export default async function CompanyExecutivesPage({ params }: { params: Promise<{ symbol: string }> }) {
  const { symbol } = await params;
  const ticker = decodeTicker(symbol);
  const [profile, executives, compensation] = await Promise.all([
    getProfile(ticker),
    getKeyExecutives(ticker),
    getExecutiveCompensation(ticker),
  ]);
  const people = executives.filter((person) => person.active !== false);
  const latestCompYear = compensation.reduce((max, row) => Math.max(max, row.year || 0), 0);
  const pay = compensation
    .filter((row) => row.year === latestCompYear)
    .sort((a, b) => (b.total ?? 0) - (a.total ?? 0))
    .slice(0, 12);

  return (
    <Container>
      <PageHeader
        title={`${profile?.companyName ?? ticker} Executives`}
        description="Key executives and latest reported compensation."
      />
      <SectionNav items={companyNav(ticker)} />
      <CompanyPeople executives={people} compensation={pay} year={latestCompYear} />
    </Container>
  );
}
