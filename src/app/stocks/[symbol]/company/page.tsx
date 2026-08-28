import { Container } from "@/components/container";
import { PageHeader } from "@/components/page-header";
import { MetricCards } from "@/components/metric-cards";
import { formatDate, formatInteger, formatNumber, formatPrice } from "@/lib/format";
import {
  getCompanyNotes,
  getEsgDisclosures,
  getEsgRatings,
  getExchangeVariants,
  getKeyExecutives,
  getProfile,
  getSecFilings,
  getSecProfile,
} from "@/lib/fmp";
import { CompanyPeople } from "@/components/company-people";
import { SectionNav } from "@/components/section-nav";
import { countryHref, countryMarketFromProfile } from "@/lib/countries";
import { industrySlug, sectorHref } from "@/lib/industries";
import { decodeTicker, quoteHref, stockPath } from "@/lib/listings";
import { companyNav } from "@/lib/nav";
import { padCik } from "@/lib/institutional";
import { secFormTitle } from "@/lib/filings";
import { addDays, isoDate, nyDateString } from "@/lib/utils";
import type { FmpProfile, FmpSecProfile } from "@/lib/types";
import type { ReactNode } from "react";
import Link from "next/link";

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

function IdentifierLink({ value }: { value?: string | null }) {
  if (!value) return "—";
  return (
    <Link href={`/search?q=${encodeURIComponent(value)}`} className="text-link hover:underline">
      {value}
    </Link>
  );
}

function fiscalYearSpan(value?: string | null) {
  if (!value) return null;
  const match = value.match(/^(\d{1,2})-(\d{1,2})$/);
  if (!match) return value;
  const endMonth = Number(match[1]);
  if (endMonth < 1 || endMonth > 12) return value;
  const startMonth = (endMonth % 12) + 1;
  return `${MONTHS[startMonth - 1]} - ${MONTHS[endMonth - 1]}`;
}

function stockType(profile?: FmpProfile | null, secProfile?: FmpSecProfile | null) {
  if (secProfile?.securityType) return secProfile.securityType;
  if (profile?.isEtf) return "ETF";
  if (profile?.isFund) return "Fund";
  if (profile && !profile.isEtf && !profile.isFund) return "Common Stock";
  return null;
}

function employeeLabel(value?: string | null) {
  if (!value) return null;
  const count = Number(String(value).replace(/,/g, ""));
  return Number.isFinite(count) ? formatInteger(count) : value;
}

function websiteHost(url?: string | null) {
  if (!url) return null;
  return url.replace(/^https?:\/\//, "").replace(/\/$/, "");
}

function ProfileTable({ title, rows }: { title?: string; rows: Array<[string, ReactNode]> }) {
  return (
    <section className="min-w-0">
      {title ? <h2 className="mb-3 text-xl font-semibold text-header">{title}</h2> : null}
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="sa-table">
          <tbody>
            {rows.map(([label, value]) => (
              <tr key={label}>
                <th className="w-44 font-medium text-muted">{label}</th>
                <td className="whitespace-normal">{value || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default async function CompanyPage({ params }: { params: Promise<{ symbol: string }> }) {
  const { symbol } = await params;
  const ticker = decodeTicker(symbol);
  const to = nyDateString();
  const from = isoDate(addDays(new Date(`${to}T00:00:00Z`), -540));
  const [profile, executives, notes, esgRatings, esgDisclosures, variants, secProfile, filings] = await Promise.all([
    getProfile(ticker),
    getKeyExecutives(ticker),
    getCompanyNotes(ticker),
    getEsgRatings(ticker),
    getEsgDisclosures(ticker),
    getExchangeVariants(ticker),
    getSecProfile(ticker),
    getSecFilings(ticker, from, to, 20),
  ]);
  const people = executives.filter((person) => person.active !== false);
  const esgRating = [...esgRatings].sort((a, b) => (b.fiscalYear ?? 0) - (a.fiscalYear ?? 0))[0] ?? null;
  const esg = esgDisclosures[0] ?? null;
  const cik = padCik(profile?.cik || secProfile?.cik || "");
  const countryMarket = countryMarketFromProfile(profile?.country || secProfile?.country);
  const countryName = countryMarket?.name ?? profile?.country ?? secProfile?.country ?? null;
  const countryValue = countryMarket ? (
    <Link href={countryHref(countryMarket.code)} className="text-link hover:underline">
      {countryName}
    </Link>
  ) : (
    countryName
  );
  const locality = [profile?.city, [profile?.state, profile?.zip].filter(Boolean).join(" ")].filter(Boolean).join(", ");
  const address = (
    <div>
      {profile?.address ? <div>{profile.address}</div> : null}
      {locality ? <div>{locality}</div> : null}
      {countryName ? <div>{countryName}</div> : null}
    </div>
  );
  const website = websiteHost(profile?.website);
  const employees = employeeLabel(profile?.fullTimeEmployees);
  const snapshot: Array<[string, ReactNode]> = [
    ["Country", countryValue],
    ["IPO Date", formatDate(profile?.ipoDate)],
    [
      "Industry",
      profile?.industry ? (
        <Link href={`/stocks/industry/${industrySlug(profile.industry)}`} className="text-link hover:underline">
          {profile.industry}
        </Link>
      ) : null,
    ],
    [
      "Sector",
      profile?.sector ? (
        <Link href={sectorHref(profile.sector)} className="text-link hover:underline">
          {profile.sector}
        </Link>
      ) : null,
    ],
    [
      "Employees",
      employees && profile?.fullTimeEmployees ? (
        <Link href={`/stocks/${ticker}/employees`} className="text-link hover:underline">
          {employees}
        </Link>
      ) : (
        employees
      ),
    ],
    ["CEO", profile?.ceo],
  ];
  const contact: Array<[string, ReactNode]> = [
    ["Address", profile?.address || locality ? address : null],
    ["Phone", profile?.phone || secProfile?.phoneNumber],
    [
      "Website",
      website && profile?.website ? (
        <a href={profile.website} className="text-link hover:underline" target="_blank" rel="noreferrer">
          {website}
        </a>
      ) : null,
    ],
  ];
  const details: Array<[string, ReactNode]> = [
    ["Ticker Symbol", ticker],
    ["Exchange", profile?.exchange || profile?.exchangeFullName],
    ["Stock Type", stockType(profile, secProfile)],
    ["Fiscal Year", fiscalYearSpan(secProfile?.fiscalYearEnd)],
    ["Reporting Currency", profile?.currency],
    ["CIK Code", <IdentifierLink key="cik" value={cik} />],
    ["CUSIP Number", <IdentifierLink key="cusip" value={profile?.cusip} />],
    ["ISIN Number", <IdentifierLink key="isin" value={profile?.isin || secProfile?.isin} />],
    ["Employer ID", secProfile?.taxIdentificationNumber],
    ["SIC Code", secProfile?.sicCode],
  ];

  const listings = variants
    .filter((row) => row.symbol && row.symbol.toUpperCase() !== ticker)
    .filter((row, index, rows) => rows.findIndex((item) => item.symbol === row.symbol) === index)
    .slice(0, 12);

  return (
    <Container>
      <PageHeader
        title={`${profile?.companyName ?? ticker} Company Profile`}
        description="Business description, headquarters, stock identifiers, and key executives."
      />
      <SectionNav items={companyNav(ticker)} />
      <h2 className="mt-2 text-xl font-semibold text-header">Company Description</h2>
      {profile?.description ? (
        <p className="mt-3 max-w-4xl text-sm leading-7 text-header/90">{profile.description}</p>
      ) : (
        <p className="mt-3 text-sm text-muted">No company description available.</p>
      )}

      <div className="mt-8 max-w-xl">
        <ProfileTable rows={snapshot} />
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-2">
        <ProfileTable title="Contact Details" rows={contact} />
        <ProfileTable title="Stock Details" rows={details} />
      </div>

      {listings.length > 0 ? (
        <section className="mt-10">
          <h2 className="mb-3 text-xl font-semibold text-header">Also Listed As</h2>
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="sa-table">
              <thead>
                <tr>
                  <th>Symbol</th>
                  <th>Exchange</th>
                  <th>Country</th>
                  <th className="num">Price</th>
                  <th>Currency</th>
                </tr>
              </thead>
              <tbody>
                {listings.map((row) => (
                  <tr key={row.symbol}>
                    <td className="symbol">
                      <Link
                        href={quoteHref(row.symbol, {
                          name: row.companyName,
                          exchange: row.exchangeShortName ?? row.exchange,
                          isEtf: row.isEtf,
                          isFund: row.isFund,
                        })}
                        className="text-link hover:underline"
                      >
                        {row.symbol}
                      </Link>
                    </td>
                    <td>{row.exchange || row.exchangeShortName || "—"}</td>
                    <td>{row.country || "—"}</td>
                    <td className="num">{formatPrice(row.price)}</td>
                    <td>{row.currency || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      <CompanyPeople executives={people} compact moreHref={stockPath(ticker, "/company/executives")} />

      {filings.length > 0 ? (
        <section className="mt-10">
          <h2 className="mb-3 text-xl font-semibold text-header">Latest SEC Filings</h2>
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="sa-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Title</th>
                </tr>
              </thead>
              <tbody>
                {[...filings]
                  .sort((a, b) => b.filingDate.localeCompare(a.filingDate))
                  .slice(0, 10)
                  .map((row) => (
                    <tr key={`${row.formType}-${row.acceptedDate}-${row.link}`}>
                      <td>{formatDate(row.filingDate)}</td>
                      <td className="font-medium">{row.formType}</td>
                      <td className="whitespace-normal">
                        <a
                          href={row.finalLink || row.link}
                          className="text-link hover:underline"
                          target="_blank"
                          rel="noreferrer"
                        >
                          {secFormTitle(row.formType)}
                        </a>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-sm">
            <Link href={`/stocks/${ticker}/filings`} className="text-link hover:underline">
              View all SEC filings
            </Link>
          </p>
        </section>
      ) : null}

      {esgRating || esg ? (
        <section className="mt-10">
          <h2 className="mb-3 text-xl font-semibold text-header">ESG</h2>
          <MetricCards
            items={[
              { label: "ESG Rating", value: esgRating?.ESGRiskRating ?? "—" },
              { label: "Industry Rank", value: esgRating?.industryRank ?? "—" },
              { label: "ESG Score", value: esg?.ESGScore != null ? formatNumber(esg.ESGScore) : "—" },
              { label: "Environmental", value: esg?.environmentalScore != null ? formatNumber(esg.environmentalScore) : "—" },
              { label: "Social", value: esg?.socialScore != null ? formatNumber(esg.socialScore) : "—" },
              { label: "Governance", value: esg?.governanceScore != null ? formatNumber(esg.governanceScore) : "—" },
            ]}
          />
          <p className="mt-2 text-sm text-muted">
            Rating year {esgRating?.fiscalYear ?? "—"}. Disclosure as of {formatDate(esg?.date)}
            {esg?.url ? (
              <>
                {" "}
                ·{" "}
                <a href={esg.url} className="text-link hover:underline" target="_blank" rel="noreferrer">
                  {esg.formType || "SEC"}
                </a>
              </>
            ) : null}
            .{" "}
            <Link href={stockPath(ticker, "/esg")} className="text-link hover:underline">
              Full ESG page
            </Link>
            .
          </p>
        </section>
      ) : null}

      {notes.length > 0 ? (
        <section className="mt-10">
          <h2 className="mb-3 text-xl font-semibold text-header">Company Notes</h2>
          <ul className="divide-y divide-border rounded-lg border border-border">
            {notes.map((note) => (
              <li key={`${note.cik}-${note.title}`} className="px-4 py-2.5 text-sm">
                {note.title}
                {note.exchange ? <span className="ml-2 text-xs text-muted">{note.exchange}</span> : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </Container>
  );
}
