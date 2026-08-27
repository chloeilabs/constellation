import { Container } from "@/components/container";
import { PageHeader } from "@/components/page-header";
import { SectionNav } from "@/components/section-nav";
import { quoteFundamentalsNav } from "@/lib/nav";
import { MetricCards } from "@/components/metric-cards";
import { ChangePercent } from "@/components/change";
import { formatCompactUsd, formatDate, formatInteger, formatPercentPlain } from "@/lib/format";
import { getLatestInstitutionalOwnership } from "@/lib/fmp";

export default async function OwnershipPage({ params }: { params: Promise<{ symbol: string }> }) {
  const { symbol } = await params;
  const ticker = symbol.toUpperCase();
  const { summary, year, quarter, holders } = await getLatestInstitutionalOwnership(ticker, 40);
  const ranked = [...holders].sort((a, b) => (b.marketValue || 0) - (a.marketValue || 0));

  return (
    <Container>
      <PageHeader
        title={`${ticker} Institutional Ownership`}
        description="13F positions, top holders, and changes versus the prior quarter."
      />
      <SectionNav items={quoteFundamentalsNav(ticker)} />
      {summary ? (
        <>
          <p className="mb-4 text-sm text-muted">
            Latest 13F snapshot: Q{quarter} {year} (period ending {formatDate(summary.date)}). Ownership can exceed 100%
            when short interest, options, and overlapping filings are included.
          </p>
          <MetricCards
            items={[
              {
                label: "Institutions",
                value: formatInteger(summary.investorsHolding),
                hint: `${summary.investorsHoldingChange >= 0 ? "+" : ""}${formatInteger(summary.investorsHoldingChange)} vs prior quarter`,
              },
              {
                label: "Ownership",
                value: formatPercentPlain(summary.ownershipPercent, { alreadyPercent: true }),
                hint: `${summary.ownershipPercentChange >= 0 ? "+" : ""}${summary.ownershipPercentChange.toFixed(2)} pts`,
              },
              {
                label: "13F Shares",
                value: formatInteger(summary.numberOf13Fshares),
                hint: `${summary.numberOf13FsharesChange >= 0 ? "+" : ""}${formatInteger(summary.numberOf13FsharesChange)}`,
              },
              {
                label: "Invested Value",
                value: formatCompactUsd(summary.totalInvested),
                hint: `${summary.totalInvestedChange >= 0 ? "+" : "−"}${formatCompactUsd(Math.abs(summary.totalInvestedChange))}`,
              },
              {
                label: "New / Closed",
                value: `${formatInteger(summary.newPositions)} / ${formatInteger(summary.closedPositions)}`,
              },
              {
                label: "Put / Call",
                value: summary.putCallRatio?.toFixed(2) ?? "—",
              },
            ]}
          />
        </>
      ) : (
        <p className="text-sm text-muted">Institutional ownership data is not available for this symbol.</p>
      )}

      <section className="mt-10">
        <h2 className="mb-3 text-lg font-semibold text-header">Top Institutional Holders</h2>
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="sa-table">
            <thead>
              <tr>
                <th>Holder</th>
                <th className="num">Shares</th>
                <th className="num">Change</th>
                <th className="num">Value</th>
                <th className="num">% Out</th>
                <th>Filed</th>
              </tr>
            </thead>
            <tbody>
              {ranked.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-muted">
                    No 13F holder details for this period.
                  </td>
                </tr>
              ) : (
                ranked.map((row) => (
                  <tr key={`${row.cik}-${row.investorName}`}>
                    <td className="max-w-[280px] truncate font-medium">
                      {row.investorName}
                      {row.isNew ? <span className="ml-2 text-xs font-normal text-gain">New</span> : null}
                    </td>
                    <td className="num">{formatInteger(row.sharesNumber)}</td>
                    <td className="num">
                      <ChangePercent value={row.changeInSharesNumberPercentage} alreadyPercent />
                    </td>
                    <td className="num">{formatCompactUsd(row.marketValue)}</td>
                    <td className="num">{formatPercentPlain(row.ownership, { alreadyPercent: true })}</td>
                    <td>{formatDate(row.filingDate)}</td>
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
