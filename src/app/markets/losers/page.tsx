import { Container } from "@/components/container";
import { PageHeader } from "@/components/page-header";
import { MoversTable } from "@/components/movers-table";
import { SectionNav } from "@/components/section-nav";
import { MARKET_NAV } from "@/lib/nav";
import { getLosers } from "@/lib/fmp";

export default async function LosersPage() {
  const rows = await getLosers();
  return (
    <Container>
      <PageHeader title="Top Losers" description="Stocks with the largest percentage declines today." />
      <SectionNav items={MARKET_NAV} />
      <MoversTable title="Biggest Losers" href="/markets/losers" rows={rows} />
    </Container>
  );
}
