import { Container } from "@/components/container";
import { CongressTable } from "@/components/congress-table";
import { PageHeader } from "@/components/page-header";
import { SectionNav } from "@/components/section-nav";
import { CONGRESS_NAV } from "@/lib/nav";
import { loadCongressTrades, type CongressChamber } from "@/lib/congress";
import { notFound } from "next/navigation";

const COPY: Record<CongressChamber, { title: string; description: string }> = {
  all: {
    title: "Congressional Trading",
    description: "Latest STOCK Act disclosures from U.S. senators and representatives, using live FMP filings.",
  },
  senate: {
    title: "Senate Trading",
    description: "Recent stock, bond, and fund trades disclosed by U.S. senators and their families.",
  },
  house: {
    title: "House Trading",
    description: "Recent stock, bond, and fund trades disclosed by members of the U.S. House of Representatives.",
  },
};

export default async function CongressPage({ params }: { params: Promise<{ slug?: string[] }> }) {
  const { slug } = await params;
  if (slug && slug.length > 1) notFound();
  const part = slug?.[0];
  const chamber: CongressChamber | null =
    !part ? "all" : part === "senate" || part === "house" ? part : null;
  if (!chamber) notFound();
  const rows = await loadCongressTrades(chamber, 80);
  const copy = COPY[chamber];

  return (
    <Container>
      <PageHeader title={copy.title} description={copy.description} />
      <SectionNav items={CONGRESS_NAV} />
      <p className="mb-3 text-sm text-muted">{rows.length} recent disclosures</p>
      <CongressTable rows={rows} />
    </Container>
  );
}
