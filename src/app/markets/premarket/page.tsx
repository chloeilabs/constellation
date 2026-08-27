import { Container } from "@/components/container";
import { ExtendedHoursTables } from "@/components/extended-hours-tables";
import { PageHeader } from "@/components/page-header";
import { SectionNav } from "@/components/section-nav";
import { getExtendedHoursRows } from "@/lib/extended-hours";
import { MARKET_NAV } from "@/lib/nav";

export const metadata = {
  title: "Premarket Stock Movers",
  description: "Premarket and extended-hours stock movers from live Financial Modeling Prep aftermarket prints.",
};

export default async function PremarketPage() {
  const rows = await getExtendedHoursRows();
  return (
    <Container>
      <PageHeader
        title="Premarket"
        description="Latest extended-hours prints versus the regular-session last price. FMP serves the same aftermarket feed before the open and after the close."
      />
      <SectionNav items={MARKET_NAV} />
      <ExtendedHoursTables rows={rows} />
    </Container>
  );
}
