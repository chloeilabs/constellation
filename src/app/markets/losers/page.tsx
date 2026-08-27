import { Container } from "@/components/container";
import { PageHeader } from "@/components/page-header";
import { MoversTable } from "@/components/movers-table";
import { getLosers } from "@/lib/fmp";

export default async function LosersPage() {
  const rows = await getLosers();
  return (
    <Container>
      <PageHeader title="Top Losers" description="Stocks with the largest percentage declines today." />
      <MoversTable title="Biggest Losers" href="/markets/losers" rows={rows.slice(0, 50)} />
    </Container>
  );
}
