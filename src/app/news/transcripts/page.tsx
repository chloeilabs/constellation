import Link from "next/link";
import { Container } from "@/components/container";
import { PageHeader } from "@/components/page-header";
import { SectionNav } from "@/components/section-nav";
import { NEWS_NAV } from "@/lib/nav";
import { formatDate } from "@/lib/format";
import { getLatestTranscripts } from "@/lib/fmp";
import { isForeignListingSymbol } from "@/lib/listings";

export const metadata = {
  title: "Earnings Transcripts",
  description: "Latest earnings call transcripts from Financial Modeling Prep.",
};

export default async function TranscriptsHubPage() {
  const raw = await getLatestTranscripts(80);
  const seen = new Set<string>();
  const rows = raw.filter((row) => {
    if (!row.symbol || isForeignListingSymbol(row.symbol)) return false;
    const key = `${row.symbol}|${row.fiscalYear}|${row.quarter ?? row.period}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return (
    <Container>
      <PageHeader
        title="Earnings Transcripts"
        description="Recently published earnings call transcripts, linked to the full text on each quote."
      />
      <SectionNav items={NEWS_NAV} />
      <p className="mb-3 text-sm text-muted">{rows.length} recent transcripts</p>
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="sa-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Symbol</th>
              <th>Period</th>
              <th>Transcript</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={4} className="text-muted">
                  No recent transcripts.
                </td>
              </tr>
            ) : (
              rows.map((row) => {
                const quarter = row.quarter ?? (Number(String(row.period || "").replace(/\D/g, "")) || 1);
                const href = `/stocks/${row.symbol}/transcripts?year=${row.fiscalYear}&quarter=${quarter}`;
                return (
                  <tr key={`${row.symbol}-${row.fiscalYear}-${row.period}-${row.date}`}>
                    <td>{formatDate(row.date)}</td>
                    <td className="symbol">
                      <Link href={`/stocks/${row.symbol}`} className="text-link hover:underline">
                        {row.symbol}
                      </Link>
                    </td>
                    <td>
                      {row.period || `Q${quarter}`} {row.fiscalYear}
                    </td>
                    <td>
                      <Link href={href} className="text-link hover:underline">
                        Read transcript
                      </Link>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </Container>
  );
}
