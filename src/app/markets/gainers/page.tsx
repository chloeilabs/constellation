import { Container } from "@/components/container";
import { PageHeader } from "@/components/page-header";
import { MoversTable } from "@/components/movers-table";
import { getGainers } from "@/lib/fmp";

export default async function GainersPage() {
  const rows = await getGainers();
  return (
    <Container>
      <PageHeader title="Top Gainers" description="Stocks with the largest percentage increases today." />
      <MoversTable title="Biggest Gainers" href="/markets/gainers" rows={rows.slice(0, 50)} />
    </Container>
  );
}
