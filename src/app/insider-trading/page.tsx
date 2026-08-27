import { Container } from "@/components/container";
import { InsiderTable } from "@/components/insider-table";
import { PageHeader } from "@/components/page-header";
import { SectionNav } from "@/components/section-nav";
import { CONGRESS_NAV } from "@/lib/nav";
import { getLatestInsiderTrades } from "@/lib/fmp";
import { isForeignListingSymbol } from "@/lib/listings";

export default async function InsiderTradingPage() {
  const rows = await getLatestInsiderTrades(100);
  const usRows = rows.filter((row) => !isForeignListingSymbol(row.symbol));

  return (
    <Container>
      <PageHeader
        title="Insider Trading"
        description="The latest Form 4 filings from officers, directors, and major shareholders."
      />
      <SectionNav items={CONGRESS_NAV} />
      <InsiderTable rows={usRows.slice(0, 75)} />
    </Container>
  );
}
