import Link from "next/link";
import { Container } from "@/components/container";
import { PageHeader } from "@/components/page-header";
import { formatCompactUsd, formatInteger, formatPercentPlain } from "@/lib/format";
import { getEtfHoldings, getEtfInfo } from "@/lib/fmp";
import { decodeTicker, holdingQuoteHref } from "@/lib/listings";
import { vehicleNoun, type VehicleKind } from "@/lib/vehicle";

export async function VehicleHoldings({ symbol, kind }: { symbol: string; kind: VehicleKind }) {
  const ticker = decodeTicker(symbol);
  const noun = vehicleNoun(kind);
  const [info, holdings] = await Promise.all([getEtfInfo(ticker), getEtfHoldings(ticker)]);
  const ranked = [...holdings].sort((a, b) => (b.weightPercentage ?? 0) - (a.weightPercentage ?? 0));
  const shown = ranked.slice(0, 100);
  const coverage = shown.reduce((sum, row) => sum + (row.weightPercentage || 0), 0);

  return (
    <Container>
      <PageHeader
        title={`${ticker} Holdings`}
        description={`${formatInteger(info?.holdingsCount ?? ranked.length)} positions. Showing the largest ${shown.length} by weight (${formatPercentPlain(coverage, { alreadyPercent: true })} of assets).`}
      />
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="sa-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Symbol</th>
              <th>Name</th>
              <th className="num">Shares</th>
              <th className="num">Weight</th>
              <th className="num">Market Value</th>
            </tr>
          </thead>
          <tbody>
            {shown.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-muted">
                  Holdings are unavailable for this {noun}.
                </td>
              </tr>
            ) : (
              shown.map((row, index) => {
                const href = holdingQuoteHref(row.asset, row.name);
                return (
                  <tr key={`${row.asset}-${index}`}>
                    <td className="text-muted">{index + 1}</td>
                    <td className="symbol">
                      {href ? (
                        <Link href={href} className="text-link hover:underline">
                          {row.asset}
                        </Link>
                      ) : (
                        row.asset || "—"
                      )}
                    </td>
                    <td className="max-w-[280px] truncate">{row.name}</td>
                    <td className="num">{formatInteger(row.sharesNumber)}</td>
                    <td className="num">{formatPercentPlain(row.weightPercentage, { alreadyPercent: true })}</td>
                    <td className="num">{formatCompactUsd(row.marketValue)}</td>
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
