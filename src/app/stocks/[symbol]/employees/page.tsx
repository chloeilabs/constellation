import { Container } from "@/components/container";
import { PageHeader } from "@/components/page-header";
import { SectionNav } from "@/components/section-nav";
import { quoteFundamentalsNav } from "@/lib/nav";
import { MetricCards } from "@/components/metric-cards";
import { HistoryBars } from "@/components/history-bars";
import { ChangePercent } from "@/components/change";
import { compactMoneyFn, formatDate, formatInteger, reportingCurrency, yearOverYear } from "@/lib/format";
import { decodeTicker } from "@/lib/listings";
import { getHistoricalEmployeeCount, getIncomeTtm } from "@/lib/fmp";

export default async function EmployeesPage({ params }: { params: Promise<{ symbol: string }> }) {
  const { symbol } = await params;
  const ticker = decodeTicker(symbol);
  const [history, ttm] = await Promise.all([getHistoricalEmployeeCount(ticker, 40), getIncomeTtm(ticker)]);
  const ordered = [...history].sort((a, b) => b.periodOfReport.localeCompare(a.periodOfReport));
  const latest = ordered[0];
  const prior = ordered[1];
  const yoy = yearOverYear(latest?.employeeCount, prior?.employeeCount);
  const change = latest && prior ? latest.employeeCount - prior.employeeCount : null;
  const revenuePerEmployee = ttm?.revenue && latest?.employeeCount ? ttm.revenue / latest.employeeCount : null;
  const profitPerEmployee = ttm?.netIncome && latest?.employeeCount ? ttm.netIncome / latest.employeeCount : null;
  const money = compactMoneyFn(reportingCurrency(ttm?.reportedCurrency));
  const chartItems = [...ordered].reverse().map((row) => ({
    label: row.periodOfReport.slice(0, 4),
    value: row.employeeCount,
  }));

  return (
    <Container>
      <PageHeader
        title={`${ticker} Employees`}
        description="Reported headcount from annual filings, with revenue and profit per employee."
      />
      <SectionNav items={quoteFundamentalsNav(ticker)} />
      <MetricCards
        items={[
          { label: "Employees", value: formatInteger(latest?.employeeCount) },
          { label: "Change (1Y)", value: change == null ? "—" : formatInteger(change) },
          {
            label: "Growth (1Y)",
            value: yoy == null ? "—" : <ChangePercent value={yoy} alreadyPercent={false} className="text-2xl" />,
          },
          { label: "Revenue / Employee", value: revenuePerEmployee ? money(revenuePerEmployee) : "—" },
          { label: "Profits / Employee", value: profitPerEmployee ? money(profitPerEmployee) : "—" },
          { label: "As of", value: formatDate(latest?.periodOfReport) },
        ]}
      />
      {chartItems.length > 1 ? (
        <section className="mt-10">
          <h2 className="mb-3 text-lg font-semibold text-header">Employees Chart</h2>
          <HistoryBars items={chartItems} formatValue={formatInteger} />
        </section>
      ) : null}
      <section className="mt-10">
        <h2 className="mb-3 text-lg font-semibold text-header">Employee History</h2>
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="sa-table">
            <thead>
              <tr>
                <th>Date</th>
                <th className="num">Employees</th>
                <th className="num">Change</th>
                <th className="num">Growth</th>
                <th>Filing</th>
              </tr>
            </thead>
            <tbody>
              {ordered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-muted">
                    No employee history available.
                  </td>
                </tr>
              ) : (
                ordered.map((row, index) => {
                  const previous = ordered[index + 1];
                  const delta = previous ? row.employeeCount - previous.employeeCount : null;
                  const growth = yearOverYear(row.employeeCount, previous?.employeeCount);
                  return (
                    <tr key={`${row.periodOfReport}-${row.filingDate}`}>
                      <td>{formatDate(row.periodOfReport)}</td>
                      <td className="num">{formatInteger(row.employeeCount)}</td>
                      <td className="num">{formatInteger(delta)}</td>
                      <td className="num">
                        <ChangePercent value={growth} alreadyPercent={false} />
                      </td>
                      <td>
                        {row.source ? (
                          <a href={row.source} className="text-link hover:underline" target="_blank" rel="noreferrer">
                            {row.formType}
                          </a>
                        ) : (
                          row.formType
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>
    </Container>
  );
}
