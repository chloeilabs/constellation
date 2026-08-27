import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/container";
import { CongressTable } from "@/components/congress-table";
import { MetricCards } from "@/components/metric-cards";
import { PageHeader } from "@/components/page-header";
import { SectionNav } from "@/components/section-nav";
import { congressSide, loadCongressTrades, loadPoliticianTrades, uniquePoliticians, type CongressChamber } from "@/lib/congress";
import { formatDate, formatInteger } from "@/lib/format";
import { CONGRESS_NAV } from "@/lib/nav";

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

const RESERVED = new Set(["senate", "house"]);

export async function generateMetadata({ params }: { params: Promise<{ slug?: string[] }> }) {
  const { slug } = await params;
  const part = slug?.[0];
  if (part && !RESERVED.has(part) && slug?.length === 1) {
    const politician = await loadPoliticianTrades(part);
    if (politician) {
      return {
        title: `${politician.name} Stock Trades`,
        description: `STOCK Act disclosures for ${politician.name} from Financial Modeling Prep.`,
      };
    }
  }
  const chamber: CongressChamber = part === "senate" || part === "house" ? part : "all";
  return { title: COPY[chamber].title, description: COPY[chamber].description };
}

export default async function CongressPage({ params }: { params: Promise<{ slug?: string[] }> }) {
  const { slug } = await params;
  if (slug && slug.length > 1) notFound();
  const part = slug?.[0];
  if (part && !RESERVED.has(part)) {
    return <PoliticianPage slug={part} />;
  }
  const chamber: CongressChamber = part === "senate" || part === "house" ? part : "all";
  const rows = await loadCongressTrades(chamber, 80);
  const copy = COPY[chamber];
  const people = uniquePoliticians(rows);

  return (
    <Container>
      <PageHeader title={copy.title} description={copy.description} />
      <SectionNav items={CONGRESS_NAV} />
      {people.length > 0 ? (
        <div className="mb-6 flex flex-wrap gap-2">
          {people.map((person) => (
            <Link
              key={person.href}
              href={person.href}
              className="rounded-full bg-chip px-3 py-1 text-sm font-medium text-header hover:bg-border"
            >
              {person.name}
            </Link>
          ))}
        </div>
      ) : null}
      <p className="mb-3 text-sm text-muted">{rows.length} recent disclosures</p>
      <CongressTable rows={rows} />
    </Container>
  );
}

async function PoliticianPage({ slug }: { slug: string }) {
  const politician = await loadPoliticianTrades(slug);
  if (!politician) notFound();
  const { name, rows, profile } = politician;
  const buys = rows.filter((row) => congressSide(row.type) === "Buy").length;
  const sells = rows.filter((row) => congressSide(row.type) === "Sell").length;
  const latest = rows[0];
  const chamber = [...new Set(rows.map((row) => row.chamber))].join(" / ");
  const party = profile?.latestParty;
  const state = profile?.latestState || latest?.district;
  const subtitle = [party, state, profile?.latestPosition || chamber].filter(Boolean).join(" · ");

  return (
    <Container>
      <PageHeader
        title={`${name} Stock Trades`}
        description={`STOCK Act disclosures for ${name}${subtitle ? ` (${subtitle})` : ""}.`}
      />
      <SectionNav items={CONGRESS_NAV} />
      <div className="mb-6 flex flex-wrap items-start gap-5">
        {profile?.image ? (
          // Politician headshots are hosted on FMP's image CDN.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={profile.image}
            alt=""
            className="h-24 w-24 rounded-lg object-cover bg-muted-bg"
          />
        ) : null}
        <div className="min-w-0 flex-1">
          <p className="text-sm text-muted">{subtitle || chamber}</p>
          {profile?.yearsActive ? (
            <p className="mt-1 text-sm text-muted">
              {profile.active ? "Active" : "Former"} · {profile.yearsActive.toFixed(1)} years in office
            </p>
          ) : null}
        </div>
      </div>
      <MetricCards
        items={[
          { label: "Trades", value: formatInteger(rows.length) },
          { label: "Purchases", value: formatInteger(buys) },
          { label: "Sales", value: formatInteger(sells) },
          {
            label: "Latest Trade",
            value: formatDate(latest?.transactionDate),
            hint: latest?.symbol ? latest.symbol : undefined,
          },
        ]}
      />
      <section className="mt-8">
        <CongressTable rows={rows} showPolitician={false} empty={`No trades found for ${name}.`} />
      </section>
    </Container>
  );
}
