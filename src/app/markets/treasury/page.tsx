import { Container } from "@/components/container";
import { PageHeader } from "@/components/page-header";
import { SectionNav } from "@/components/section-nav";
import { HistoryBars } from "@/components/history-bars";
import { MARKET_NAV } from "@/lib/nav";
import { formatDate, formatPercentPlain } from "@/lib/format";
import { getTreasuryRates } from "@/lib/fmp";
import { addDays, isoDate, nyDateString } from "@/lib/utils";

const CURVE = [
  ["1M", "month1"],
  ["2M", "month2"],
  ["3M", "month3"],
  ["6M", "month6"],
  ["1Y", "year1"],
  ["2Y", "year2"],
  ["3Y", "year3"],
  ["5Y", "year5"],
  ["7Y", "year7"],
  ["10Y", "year10"],
  ["20Y", "year20"],
  ["30Y", "year30"],
] as const;

export const metadata = {
  title: "U.S. Treasury Yields",
  description: "Live U.S. Treasury yield curve from Financial Modeling Prep.",
};

export default async function TreasuryPage() {
  const today = nyDateString();
  const from = isoDate(addDays(new Date(`${today}T00:00:00Z`), -90));
  const rates = await getTreasuryRates(from, today);
  const ordered = [...rates].sort((a, b) => b.date.localeCompare(a.date));
  const latest = ordered[0] ?? null;
  const history = [...ordered].reverse();
  const curve = latest
    ? CURVE.map(([label, key]) => ({
        label,
        value: typeof latest[key] === "number" ? latest[key] : 0,
      })).filter((row) => row.value > 0)
    : [];

  return (
    <Container>
      <PageHeader
        title="U.S. Treasury Yields"
        description="The Treasury curve from FMP daily rates. Yields are percent, not decimal."
      />
      <SectionNav items={MARKET_NAV} />
      {latest ? (
        <>
          <p className="mb-4 text-sm text-muted">As of {formatDate(latest.date)}.</p>
          <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {CURVE.filter(([, key]) => key === "month3" || key === "year2" || key === "year10" || key === "year30").map(
              ([label, key]) => (
                <div key={key} className="rounded-lg border border-border p-4">
                  <div className="text-sm text-muted">{label}</div>
                  <div className="mt-1 text-2xl font-semibold tabular">
                    {formatPercentPlain(latest[key], { alreadyPercent: true })}
                  </div>
                </div>
              ),
            )}
          </div>
          {curve.length > 0 ? (
            <div className="mb-8">
              <h2 className="mb-3 text-lg font-semibold text-header">Yield Curve</h2>
              <HistoryBars items={curve} formatValue={(value) => `${value.toFixed(2)}%`} />
            </div>
          ) : null}
          <h2 className="mb-3 text-lg font-semibold text-header">Recent History</h2>
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="sa-table">
              <thead>
                <tr>
                  <th>Date</th>
                  {CURVE.map(([label]) => (
                    <th key={label} className="num">
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {history
                  .slice(-30)
                  .reverse()
                  .map((row) => (
                    <tr key={row.date}>
                      <td>{formatDate(row.date)}</td>
                      {CURVE.map(([, key]) => (
                        <td key={key} className="num">
                          {formatPercentPlain(row[key], { alreadyPercent: true })}
                        </td>
                      ))}
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <p className="text-sm text-muted">Treasury rates are unavailable.</p>
      )}
    </Container>
  );
}
