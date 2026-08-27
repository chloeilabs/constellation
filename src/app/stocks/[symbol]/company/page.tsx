import { Container } from "@/components/container";
import { PageHeader } from "@/components/page-header";
import { formatCompactUsd, formatDate, formatInteger } from "@/lib/format";
import { getKeyExecutives, getProfile } from "@/lib/fmp";

export default async function CompanyPage({ params }: { params: Promise<{ symbol: string }> }) {
  const { symbol } = await params;
  const ticker = symbol.toUpperCase();
  const [profile, executives] = await Promise.all([getProfile(ticker), getKeyExecutives(ticker)]);
  const people = executives.filter((person) => person.active !== false);

  const details = [
    ["CEO", profile?.ceo],
    ["Sector", profile?.sector],
    ["Industry", profile?.industry],
    ["Employees", profile?.fullTimeEmployees],
    ["Headquarters", [profile?.city, profile?.state, profile?.country].filter(Boolean).join(", ")],
    ["Address", [profile?.address, profile?.zip].filter(Boolean).join(", ")],
    ["Phone", profile?.phone],
    ["IPO Date", formatDate(profile?.ipoDate)],
    ["CIK", profile?.cik],
    ["ISIN", profile?.isin],
    ["CUSIP", profile?.cusip],
    ["Exchange", profile?.exchangeFullName],
  ] as const;

  return (
    <Container>
      <PageHeader
        title={`${profile?.companyName ?? ticker} Company Profile`}
        description="Business description, headquarters, and key executives."
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
            <dd className="text-sm font-medium">{value || "—"}</dd>
          </div>
        ))}
      </dl>

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
    </Container>
  );
}
