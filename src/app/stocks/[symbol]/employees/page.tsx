import Link from "next/link";
import { Container } from "@/components/container";
import { DownloadCsvButton } from "@/components/download-csv";
import { PageHeader } from "@/components/page-header";
import { SectionNav } from "@/components/section-nav";
import { quoteFundamentalsNav } from "@/lib/nav";
import { MetricCards } from "@/components/metric-cards";
import { HistoryBars } from "@/components/history-bars";
import { ChangePercent } from "@/components/change";
import {
  compactMoneyFn,
  formatDate,
  formatInteger,
  formatMoneyWhole,
  formatPercentPlain,
  reportingCurrency,
  yearOverYear,
} from "@/lib/format";
import { decodeTicker, displayCompanyName, stockPath } from "@/lib/listings";
import { getHistoricalEmployeeCount, getIncomeTtm, getProfile, getQuote } from "@/lib/fmp";
import { cn } from "@/lib/utils";

function employeeIntro(
  name: string,
  count: number | null | undefined,
  asOf: string | null | undefined,
  change: number | null,
  growth: number | null,
) {
  if (count == null || !asOf) {
    return "Reported headcount from annual filings, with revenue and profit per employee.";
  }
  const headcount = formatInteger(count);
  const date = formatDate(asOf, { month: "long" });
  const lead = `${name} had ${headcount} employees as of ${date}.`;
  if (change == null || growth == null) return lead;
  if (change === 0) return `${lead} The number of employees was unchanged compared to the previous year.`;
  const direction = change > 0 ? "increased" : "decreased";
  return `${lead} The number of employees ${direction} by ${formatInteger(Math.abs(change))} or ${formatPercentPlain(growth)} compared to the previous year.`;
}

export default async function EmployeesPage({
  params,
  searchParams,
}: {
  params: Promise<{ symbol: string }>;
  searchParams: Promise<{ chart?: string }>;
}) {
  const { symbol } = await params;
  const { chart: chartParam } = await searchParams;
  const ticker = decodeTicker(symbol);
  const chartMode = chartParam === "change" || chartParam === "growth" ? chartParam : "total";
  const base = stockPath(ticker, "/employees");
  const [history, ttm, quote, profile] = await Promise.all([
    getHistoricalEmployeeCount(ticker, 40),
    getIncomeTtm(ticker),
    getQuote(ticker),
    getProfile(ticker),
  ]);
  const ordered = [...history].sort((a, b) => b.periodOfReport.localeCompare(a.periodOfReport));
  const latest = ordered[0];
  const prior = ordered[1];
  const yoy = yearOverYear(latest?.employeeCount, prior?.employeeCount);
  const change = latest && prior ? latest.employeeCount - prior.employeeCount : null;
  const revenuePerEmployee = ttm?.revenue && latest?.employeeCount ? ttm.revenue / latest.employeeCount : null;
  const profitPerEmployee = ttm?.netIncome && latest?.employeeCount ? ttm.netIncome / latest.employeeCount : null;
  const currency = reportingCurrency(ttm?.reportedCurrency, profile?.currency);
  const money = compactMoneyFn(currency);
  const shortName = displayCompanyName(profile?.companyName) || ticker;
  const chronological = [...ordered].reverse();
  const chartItems = chronological.flatMap((row, index) => {
    const previous = chronological[index - 1];
    const delta = previous ? row.employeeCount - previous.employeeCount : null;
    const growth = yearOverYear(row.employeeCount, previous?.employeeCount);
    const value =
      chartMode === "change" ? delta : chartMode === "growth" ? (growth == null ? null : growth * 100) : row.employeeCount;
    if (value == null) return [];
    return [{ label: row.periodOfReport.slice(0, 4), value }];
  });
  const formatChart =
    chartMode === "growth" ? (value: number) => formatPercentPlain(value, { alreadyPercent: true }) : formatInteger;

  return (
    <Container>
      <PageHeader
        title={`${shortName} Employees`}
        description={employeeIntro(shortName, latest?.employeeCount, latest?.periodOfReport, change, yoy)}
        actions={
          ordered.length ? (
            <DownloadCsvButton
              filename={`${ticker}-employees.csv`}
              headers={["Date", "Employees", "Change", "Growth", "Filing Date", "Form"]}
              rows={ordered.map((row, index) => {
                const previous = ordered[index + 1];
                const delta = previous ? row.employeeCount - previous.employeeCount : null;
                const growth = yearOverYear(row.employeeCount, previous?.employeeCount);
                return [
                  row.periodOfReport,
                  row.employeeCount,
                  delta,
                  growth == null ? null : Number((growth * 100).toFixed(2)),
                  row.filingDate,
                  row.formType,
                ];
              })}
            />
          ) : null
        }
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
          {
            label: "Revenue / Employee",
            value: formatMoneyWhole(revenuePerEmployee, currency),
            href: stockPath(ticker, "/revenue"),
          },
          {
            label: "Profits / Employee",
            value: formatMoneyWhole(profitPerEmployee, currency),
            href: stockPath(ticker, "/net-income"),
          },
          {
            label: "Market Cap",
            value: money(quote?.marketCap ?? profile?.marketCap),
            href: stockPath(ticker, "/market-cap"),
          },
        ]}
      />
      {chartItems.length > 1 ? (
        <section className="mt-10">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-header">Employees Chart</h2>
            <div className="inline-flex rounded-md border border-border p-0.5 text-sm" role="group" aria-label="Employees chart">
              {(
                [
                  ["total", "Total", base],
                  ["change", "Change", `${base}?chart=change`],
                  ["growth", "Growth", `${base}?chart=growth`],
                ] as const
              ).map(([id, label, href]) => (
                <Link
                  key={id}
                  href={href}
                  scroll={false}
                  className={cn(
                    "rounded px-3 py-1.5 font-medium",
                    chartMode === id ? "bg-header text-on-header" : "text-muted hover:text-header",
                  )}
                >
                  {label}
                </Link>
              ))}
            </div>
          </div>
          <HistoryBars items={chartItems} formatValue={formatChart} />
        </section>
      ) : null}
      <section className="mt-10">
        <h2 className="mb-3 text-lg font-semibold text-header">Employees History</h2>
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="sa-table">
            <thead>
              <tr>
                <th>Date</th>
                <th className="num">Employees</th>
                <th className="num">Change (1Y)</th>
                <th className="num">Growth (1Y)</th>
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
