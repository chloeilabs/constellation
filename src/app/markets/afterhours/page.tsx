import { Container } from "@/components/container";
import { ExtendedHoursTables } from "@/components/extended-hours-tables";
import { PageHeader } from "@/components/page-header";
import { SectionNav } from "@/components/section-nav";
import { getExtendedHoursRows } from "@/lib/extended-hours";
import { MARKET_NAV } from "@/lib/nav";

export const metadata = {
  title: "After-Hours Stock Movers",
  description: "After-hours stock movers from live Financial Modeling Prep aftermarket trades and quotes.",
};

export default async function AfterHoursPage() {
  const rows = await getExtendedHoursRows();
  return (
    <Container>
      <PageHeader
        title="After Hours"
        description="Latest extended-hours prints versus the regular-session last price, including bid/ask-backed volume from FMP aftermarket quotes."
      />
      <SectionNav items={MARKET_NAV} />
      <ExtendedHoursTables rows={rows} />
    </Container>
  );
}
