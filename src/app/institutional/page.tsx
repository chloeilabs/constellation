import Link from "next/link";
import { Container } from "@/components/container";
import { PageHeader } from "@/components/page-header";
import { SectionNav } from "@/components/section-nav";
import { CONGRESS_NAV } from "@/lib/nav";
import { formatDate } from "@/lib/format";
import { getLatestInstitutionalFilings } from "@/lib/fmp";
import { institutionalHref, WELL_KNOWN_FILERS } from "@/lib/institutional";

export const metadata = {
  title: "Latest 13F Filings",
  description: "The most recent institutional 13F-HR filings from investment managers.",
};

export default async function InstitutionalFilingsPage() {
  const raw = await getLatestInstitutionalFilings(100);
  const seen = new Set<string>();
  const rows = raw.filter((row) => {
    if (!row.name || !row.cik || seen.has(row.cik)) return false;
    seen.add(row.cik);
    return true;
  });

  return (
    <Container>
      <PageHeader
        title="Latest 13F Filings"
        description="Recent Form 13F-HR filings from institutional investment managers, with links to the SEC documents."
      />
      <SectionNav items={CONGRESS_NAV} />
      <section className="mb-8">
        <h2 className="mb-3 text-lg font-semibold text-header">Notable 13F Filers</h2>
        <div className="flex flex-wrap gap-2">
          {WELL_KNOWN_FILERS.map((filer) => (
            <Link
              key={filer.cik}
              href={institutionalHref(filer.cik)}
              className="rounded-full bg-chip px-3 py-1 text-sm font-medium text-header hover:bg-border"
            >
              {filer.name}
            </Link>
          ))}
        </div>
      </section>
      <p className="mb-3 text-sm text-muted">{rows.length} recent filings</p>
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="sa-table">
          <thead>
            <tr>
              <th>Filed</th>
              <th>Manager</th>
              <th>Period</th>
              <th>Form</th>
              <th>SEC</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-muted">
                  No recent 13F filings.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={`${row.cik}-${row.acceptedDate}-${row.formType}`}>
                  <td>{formatDate(row.filingDate || row.acceptedDate)}</td>
                  <td className="max-w-[320px] truncate font-medium">
                    <Link href={institutionalHref(row.cik)} className="text-link hover:underline">
                      {row.name}
                    </Link>
                  </td>
                  <td>{formatDate(row.date)}</td>
                  <td>{row.formType}</td>
                  <td>
                    {row.link ? (
                      <a href={row.link} className="text-link hover:underline" target="_blank" rel="noreferrer">
                        Filing
                      </a>
                    ) : (
                      "—"
                    )}
                    {row.finalLink ? (
                      <>
                        {" "}
                        <a href={row.finalLink} className="text-link hover:underline" target="_blank" rel="noreferrer">
                          Holdings
                        </a>
                      </>
                    ) : null}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </Container>
  );
}
