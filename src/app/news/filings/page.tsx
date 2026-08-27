import Link from "next/link";
import { Container } from "@/components/container";
import { PageHeader } from "@/components/page-header";
import { SectionNav } from "@/components/section-nav";
import { formatDate } from "@/lib/format";
import { getLatestSecFilings8k, getLatestSecFilingsFinancials } from "@/lib/fmp";
import { isPrimaryUsSymbol, quoteHref } from "@/lib/listings";
import { NEWS_NAV } from "@/lib/nav";
import { addDays, isoDate, nyDateString } from "@/lib/utils";
import type { FmpSecFiling } from "@/lib/types";

export const metadata = {
  title: "Latest SEC Filings",
  description: "Recent 8-K, 10-Q, and 10-K filings from U.S. companies.",
};

function dedupeFilings(rows: FmpSecFiling[]) {
  const seen = new Set<string>();
  return rows.filter((row) => {
    if (!isPrimaryUsSymbol(row.symbol)) return false;
    const key = `${row.symbol}|${row.formType}|${row.acceptedDate || row.filingDate}|${row.link}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export default async function LatestFilingsPage() {
  const to = nyDateString();
  const from = isoDate(addDays(new Date(`${to}T00:00:00Z`), -3));
  const [eightK, financials] = await Promise.all([
    getLatestSecFilings8k(from, to, 100),
    getLatestSecFilingsFinancials(from, to, 100),
  ]);
  const rows = dedupeFilings([...eightK, ...financials]).sort((a, b) =>
    (b.acceptedDate || b.filingDate || "").localeCompare(a.acceptedDate || a.filingDate || ""),
  );
  const current = rows.filter((row) => row.formType === "8-K" || row.formType === "8-K/A");
  const statements = rows.filter((row) => /10-[KQ]|20-F|6-K/i.test(row.formType));

  return (
    <Container>
      <PageHeader
        title="Latest SEC Filings"
        description="8-K current reports and newly posted 10-Q / 10-K financials from the last few days."
      />
      <SectionNav items={NEWS_NAV} />
      <FilingTable title="Current Reports (8-K)" rows={current.slice(0, 40)} empty="No recent 8-K filings." />
      <div className="mt-10">
        <FilingTable
          title="Financial Statements"
          rows={statements.slice(0, 40)}
          empty="No recent 10-Q or 10-K filings."
        />
      </div>
    </Container>
  );
}

function FilingTable({
  title,
  rows,
  empty,
}: {
  title: string;
  rows: FmpSecFiling[];
  empty: string;
}) {
  return (
    <section>
      <h2 className="mb-3 text-lg font-semibold text-header">{title}</h2>
      <p className="mb-3 text-sm text-muted">{rows.length} filings</p>
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="sa-table">
          <thead>
            <tr>
              <th>Accepted</th>
              <th>Symbol</th>
              <th>Form</th>
              <th>Filing</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={4} className="text-muted">
                  {empty}
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={`${row.symbol}-${row.formType}-${row.acceptedDate}-${row.link}`}>
                  <td>{formatDate(row.acceptedDate || row.filingDate)}</td>
                  <td className="symbol">
                    <Link href={quoteHref(row.symbol)} className="text-link hover:underline">
                      {row.symbol}
                    </Link>
                  </td>
                  <td className="font-medium">{row.formType}</td>
                  <td>
                    {row.finalLink || row.link ? (
                      <a
                        href={row.finalLink || row.link}
                        className="text-link hover:underline"
                        target="_blank"
                        rel="noreferrer"
                      >
                        View filing
                      </a>
                    ) : (
                      "—"
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
