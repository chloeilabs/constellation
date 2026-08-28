import { Container } from "@/components/container";
import { PageHeader } from "@/components/page-header";
import { MoversTable } from "@/components/movers-table";
import { SectionNav } from "@/components/section-nav";
import { MARKET_NAV } from "@/lib/nav";
import { getGainers } from "@/lib/fmp";

export default async function GainersPage() {
  const rows = await getGainers();
  return (
    <Container>
      <PageHeader title="Top Gainers" description="Stocks with the largest percentage increases today." />
      <SectionNav items={MARKET_NAV} />
      <MoversTable title="Biggest Gainers" href="/markets/gainers" rows={rows} />
    </Container>
  );
}
