import { Container } from "@/components/container";
import { ExtendedHoursKindTable, ExtendedHoursTables } from "@/components/extended-hours-tables";
import { PageHeader } from "@/components/page-header";
import { SectionNav } from "@/components/section-nav";
import { getExtendedHoursRows } from "@/lib/extended-hours";
import { extendedHoursNav, MARKET_NAV } from "@/lib/nav";

const COPY = {
  premarket: {
    title: "Pre-Market",
    href: "/markets/premarket" as const,
    description:
      "Latest extended-hours prints versus the regular-session last price. FMP serves the same aftermarket feed before the open and after the close.",
  },
  afterhours: {
    title: "After Hours",
    href: "/markets/afterhours" as const,
    description:
      "Latest extended-hours prints versus the regular-session last price, including bid/ask-backed volume from FMP aftermarket quotes.",
  },
} as const;

const KIND_TITLE = {
  gainers: "Gainers",
  losers: "Losers",
  active: "Most Active",
} as const;

export async function ExtendedHoursOverviewPage({ session }: { session: "premarket" | "afterhours" }) {
  const rows = await getExtendedHoursRows();
  const copy = COPY[session];
  return (
    <Container>
      <PageHeader title={copy.title} description={copy.description} />
      <SectionNav items={MARKET_NAV} />
      <SectionNav items={extendedHoursNav(copy.href)} />
      <ExtendedHoursTables
        rows={rows}
        gainerHref={`${copy.href}/gainers`}
        loserHref={`${copy.href}/losers`}
        activeHref={`${copy.href}/active`}
      />
    </Container>
  );
}

export async function ExtendedHoursKindPage({
  session,
  kind,
}: {
  session: "premarket" | "afterhours";
  kind: "gainers" | "losers" | "active";
}) {
  const rows = await getExtendedHoursRows();
  const copy = COPY[session];
  return (
    <Container>
      <PageHeader
        title={`${copy.title} ${KIND_TITLE[kind]}`}
        description={copy.description}
      />
      <SectionNav items={MARKET_NAV} />
      <SectionNav items={extendedHoursNav(copy.href)} />
      <ExtendedHoursKindTable rows={rows} kind={kind} />
    </Container>
  );
}
