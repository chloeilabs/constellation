import { Container } from "@/components/container";
import { PageHeader } from "@/components/page-header";
import { MoversTable } from "@/components/movers-table";
import { getMostActive } from "@/lib/fmp";

export default async function ActivePage() {
  const rows = await getMostActive();
  return (
    <Container>
      <PageHeader title="Most Active" description="Stocks with the highest trading activity today." />
      <MoversTable title="Most Active Stocks" href="/markets/active" rows={rows.slice(0, 50)} />
    </Container>
  );
}
