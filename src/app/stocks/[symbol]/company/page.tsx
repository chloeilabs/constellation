import { Container } from "@/components/container";
import { PageHeader } from "@/components/page-header";
import { MetricCards } from "@/components/metric-cards";
import { formatCompactUsd, formatDate, formatInteger, formatNumber, formatPrice } from "@/lib/format";
import {
  getCompanyNotes,
  getEsgDisclosures,
  getEsgRatings,
  getExchangeVariants,
  getExecutiveCompensation,
  getKeyExecutives,
  getProfile,
  getSecFilings,
  getSecProfile,
} from "@/lib/fmp";
import { industrySlug, sectorHref } from "@/lib/industries";
import { decodeTicker, quoteHref } from "@/lib/listings";
import { addDays, isoDate, nyDateString } from "@/lib/utils";
import Link from "next/link";

function formatFiscalYearEnd(value?: string | null) {
  if (!value) return null;
  const match = value.match(/^(\d{1,2})-(\d{1,2})$/);
  if (!match) return value;
  const date = new Date(Date.UTC(2020, Number(match[1]) - 1, Number(match[2])));
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-US", { month: "long", day: "numeric", timeZone: "UTC" });
}

export default async function CompanyPage({ params }: { params: Promise<{ symbol: string }> }) {
  const { symbol } = await params;
  const ticker = decodeTicker(symbol);
  const to = nyDateString();
  const from = isoDate(addDays(new Date(`${to}T00:00:00Z`), -540));
  const [profile, executives, notes, esgRatings, esgDisclosures, compensation, variants, secProfile, filings] =
    await Promise.all([
      getProfile(ticker),
      getKeyExecutives(ticker),
      getCompanyNotes(ticker),
      getEsgRatings(ticker),
      getEsgDisclosures(ticker),
      getExecutiveCompensation(ticker),
      getExchangeVariants(ticker),
      getSecProfile(ticker),
      getSecFilings(ticker, from, to, 20),
    ]);
  const people = executives.filter((person) => person.active !== false);
  const esgRating = [...esgRatings].sort((a, b) => (b.fiscalYear ?? 0) - (a.fiscalYear ?? 0))[0] ?? null;
  const esg = esgDisclosures[0] ?? null;
  const latestCompYear = compensation.reduce((max, row) => Math.max(max, row.year || 0), 0);
  const pay = compensation
    .filter((row) => row.year === latestCompYear)
    .sort((a, b) => (b.total ?? 0) - (a.total ?? 0))
    .slice(0, 12);

  const details: Array<[string, string | number | null | undefined]> = [
    ["CEO", profile?.ceo],
    ["Sector", profile?.sector],
    ["Industry", profile?.industry],
    ["Employees", profile?.fullTimeEmployees],
    ["Headquarters", [profile?.city, profile?.state, profile?.country].filter(Boolean).join(", ")],
    ["Address", [profile?.address, profile?.zip].filter(Boolean).join(", ")],
    ["Phone", profile?.phone || secProfile?.phoneNumber],
    ["IPO Date", formatDate(profile?.ipoDate)],
    ["Stock Type", secProfile?.securityType],
    ["Fiscal Year End", formatFiscalYearEnd(secProfile?.fiscalYearEnd)],
    ["Incorporated", secProfile?.stateOfIncorporation],
    ["SIC", secProfile?.sicCode ? `${secProfile.sicCode}${secProfile.sicDescription ? ` · ${secProfile.sicDescription}` : ""}` : null],
    ["Employer ID", secProfile?.taxIdentificationNumber],
    ["CIK", profile?.cik || secProfile?.cik],
    ["ISIN", profile?.isin || secProfile?.isin],
    ["CUSIP", profile?.cusip],
    ["Exchange", profile?.exchangeFullName],
  ];

  const listings = variants
    .filter((row) => row.symbol && row.symbol.toUpperCase() !== ticker)
    .filter((row, index, rows) => rows.findIndex((item) => item.symbol === row.symbol) === index)
    .slice(0, 12);

  return (
    <Container>
      <PageHeader
        title={`${profile?.companyName ?? ticker} Company Profile`}
        description="Business description, headquarters, ESG, notes, and executive compensation."
      />
      {profile?.description ? (
        <p className="max-w-4xl text-sm leading-7 text-header/90">{profile.description}</p>
      ) : (
        <p className="text-sm text-muted">No company description available.</p>
      )}
      {profile?.website ? (
        <p className="mt-3 text-sm">
          <a href={profile.website} className="text-link hover:underline" target="_blank" rel="noreferrer">
            {profile.website.replace(/^https?:\/\//, "")}
          </a>
        </p>
      ) : null}

      <dl className="mt-8 grid gap-x-8 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
        {details.map(([label, value]) => (
          <div key={label}>
            <dt className="text-xs text-muted">{label}</dt>
            <dd className="text-sm font-medium">
              {label === "Employees" && profile?.fullTimeEmployees ? (
                <Link href={`/stocks/${ticker}/employees`} className="text-link hover:underline">
                  {value}
                </Link>
              ) : label === "Industry" && profile?.industry ? (
                <Link href={`/stocks/industry/${industrySlug(profile.industry)}`} className="text-link hover:underline">
                  {value}
                </Link>
              ) : label === "Sector" && profile?.sector ? (
                <Link href={sectorHref(profile.sector)} className="text-link hover:underline">
                  {value}
                </Link>
              ) : (
                value || "—"
              )}
            </dd>
          </div>
        ))}
      </dl>

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

      {filings.length > 0 ? (
        <section className="mt-10">
          <h2 className="mb-3 text-xl font-semibold text-header">Latest SEC Filings</h2>
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="sa-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Form</th>
                  <th>Filing</th>
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
                      <td>
                        <a
                          href={row.finalLink || row.link}
                          className="text-link hover:underline"
                          target="_blank"
                          rel="noreferrer"
                        >
                          View filing
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

      <section className="mt-10">
        <h2 className="mb-3 text-xl font-semibold text-header">Key Executives</h2>
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="sa-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Title</th>
                <th className="num">Pay</th>
                <th className="num">Year Born</th>
              </tr>
            </thead>
            <tbody>
              {people.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-muted">
                    Executive data is unavailable for this company.
                  </td>
                </tr>
              ) : (
                people.map((person) => (
                  <tr key={`${person.name}-${person.title}`}>
                    <td className="font-medium">{person.name}</td>
                    <td className="whitespace-normal text-muted">{person.title}</td>
                    <td className="num">
                      {person.pay != null ? formatCompactUsd(person.pay) : "—"}
                      {person.pay != null && person.currencyPay ? (
                        <span className="ml-1 text-xs text-muted">{person.currencyPay}</span>
                      ) : null}
                    </td>
                    <td className="num">{person.yearBorn ? formatInteger(person.yearBorn) : "—"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {pay.length > 0 ? (
        <section className="mt-10">
          <h2 className="mb-3 text-xl font-semibold text-header">Executive Compensation ({latestCompYear})</h2>
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="sa-table">
              <thead>
                <tr>
                  <th>Name / Position</th>
                  <th className="num">Salary</th>
                  <th className="num">Stock</th>
                  <th className="num">Bonus / Incentive</th>
                  <th className="num">Other</th>
                  <th className="num">Total</th>
                </tr>
              </thead>
              <tbody>
                {pay.map((row) => (
                  <tr key={`${row.nameAndPosition}-${row.year}`}>
                    <td className="max-w-[280px] whitespace-normal font-medium">{row.nameAndPosition}</td>
                    <td className="num">{formatCompactUsd(row.salary)}</td>
                    <td className="num">{formatCompactUsd((row.stockAward || 0) + (row.optionAward || 0))}</td>
                    <td className="num">{formatCompactUsd((row.bonus || 0) + (row.incentivePlanCompensation || 0))}</td>
                    <td className="num">{formatCompactUsd(row.allOtherCompensation)}</td>
                    <td className="num font-semibold">{formatCompactUsd(row.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {pay[0]?.link ? (
            <p className="mt-2 text-sm text-muted">
              From the{" "}
              <a href={pay[0].link} className="text-link hover:underline" target="_blank" rel="noreferrer">
                proxy filing
              </a>
              .
            </p>
          ) : null}
        </section>
      ) : null}
    </Container>
  );
}
