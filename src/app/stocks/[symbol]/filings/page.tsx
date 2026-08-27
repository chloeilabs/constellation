import { Container } from "@/components/container";
import { PageHeader } from "@/components/page-header";
import { SectionNav } from "@/components/section-nav";
import { formatDate } from "@/lib/format";
import { getSecFilings } from "@/lib/fmp";
import { quoteNewsNav } from "@/lib/nav";
import { addDays, isoDate, nyDateString } from "@/lib/utils";

const PRIMARY = new Set(["10-K", "10-Q", "8-K", "10-K/A", "10-Q/A", "8-K/A", "S-1", "S-3", "DEF 14A", "20-F"]);

export default async function StockFilingsPage({ params }: { params: Promise<{ symbol: string }> }) {
  const { symbol } = await params;
  const ticker = symbol.toUpperCase();
  const to = nyDateString();
  const from = isoDate(addDays(new Date(`${to}T00:00:00Z`), -540));
  const rows = await getSecFilings(ticker, from, to, 80);
  const ordered = [...rows].sort((a, b) => {
    const primary = Number(PRIMARY.has(b.formType)) - Number(PRIMARY.has(a.formType));
    if (primary !== 0) return primary;
    return b.filingDate.localeCompare(a.filingDate);
  });

  return (
    <Container>
      <PageHeader
        title={`${ticker} SEC Filings`}
        description="Recent EDGAR filings including 10-K, 10-Q, and 8-K reports."
      />
      <SectionNav items={quoteNewsNav(ticker)} />
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
            {ordered.length === 0 ? (
              <tr>
                <td colSpan={3} className="text-muted">
                  No SEC filings in the last 18 months.
                </td>
              </tr>
            ) : (
              ordered.slice(0, 60).map((row) => (
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
              ))
            )}
          </tbody>
        </table>
      </div>
    </Container>
  );
}
