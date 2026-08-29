import Link from "next/link";
import { Container } from "@/components/container";
import { PageHeader } from "@/components/page-header";
import { SectionNav } from "@/components/section-nav";
import { quoteFundamentalsNav } from "@/lib/nav";
import { MetricCards } from "@/components/metric-cards";
import { formatDate } from "@/lib/format";
import { getSplits } from "@/lib/fmp";
import { decodeTicker, stockPath } from "@/lib/listings";

export default async function SplitsPage({ params }: { params: Promise<{ symbol: string }> }) {
  const { symbol } = await params;
  const ticker = decodeTicker(symbol);
  const splits = [...(await getSplits(ticker, 50))].sort((a, b) => b.date.localeCompare(a.date));
  const latest = splits[0];
  const forward = splits.filter((row) => (row.numerator ?? 0) > (row.denominator ?? 0)).length;
  const reverse = splits.filter((row) => (row.numerator ?? 0) < (row.denominator ?? 0)).length;

  return (
    <Container>
      <PageHeader
        title={`${ticker} Stock Splits`}
        description="Forward and reverse split history from live FMP corporate-actions data."
        actions={
          <Link
            href={stockPath(ticker, "/history")}
            className="sa-btn sa-btn-secondary"
          >
            Price History
          </Link>
        }
      />
      <SectionNav items={quoteFundamentalsNav(ticker)} />
      <MetricCards
        items={[
          { label: "Last Split", value: latest ? `${latest.numerator}:${latest.denominator}` : "—" },
          { label: "Last Split Date", value: formatDate(latest?.date) },
          { label: "Split Type", value: latest?.splitType?.replace(/-/g, " ") || "—" },
          { label: "Splits Recorded", value: String(splits.length) },
          { label: "Forward Splits", value: String(forward) },
          { label: "Reverse Splits", value: String(reverse) },
        ]}
      />
      <section className="mt-10">
        <h2 className="mb-3 text-lg font-semibold text-header">Split History</h2>
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="sa-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Ratio</th>
                <th>Type</th>
              </tr>
            </thead>
            <tbody>
              {splits.length === 0 ? (
                <tr>
                  <td colSpan={3} className="text-muted">
                    No split history available.
                  </td>
                </tr>
              ) : (
                splits.map((row) => (
                  <tr key={`${row.date}-${row.numerator}-${row.denominator}`}>
                    <td>{formatDate(row.date)}</td>
                    <td>
                      {row.numerator}:{row.denominator}
                    </td>
                    <td className="capitalize">{row.splitType?.replace(/-/g, " ") || "Stock split"}</td>
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
