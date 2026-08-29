import { Container } from "@/components/container";
import { PageHeader } from "@/components/page-header";
import { SectionNav } from "@/components/section-nav";
import { quoteFundamentalsNav } from "@/lib/nav";
import { MetricCards } from "@/components/metric-cards";
import { MetricHistory } from "@/components/metric-history";
import { ChangePercent } from "@/components/change";
import { compactMoneyFn, formatPercentPlain, reportingCurrency, yearOverYear } from "@/lib/format";
import { getIncomeStatements, getIncomeTtm } from "@/lib/fmp";
import { decodeTicker, stockPath } from "@/lib/listings";
import { ANNUAL_FILING_LIMIT, QUARTER_FILING_LIMIT, trailingSum, ttmChange } from "@/lib/statements";
import { periodFrom } from "@/components/statement-metric-page";

function num(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

export default async function OperatingExpensesPage({
  params,
  searchParams,
}: {
  params: Promise<{ symbol: string }>;
  searchParams: Promise<{ period?: string }>;
}) {
  const { symbol } = await params;
  const { period: periodParam } = await searchParams;
  const ticker = decodeTicker(symbol);
  const period = periodFrom(periodParam);
  const path = stockPath(ticker, "/operating-expenses");
  const [annual, quarterly, ttm] = await Promise.all([
    getIncomeStatements(ticker, "annual", ANNUAL_FILING_LIMIT),
    getIncomeStatements(ticker, "quarter", QUARTER_FILING_LIMIT),
    getIncomeTtm(ticker),
  ]);
  const history = period === "quarter" ? quarterly : annual;
  const q = quarterly as Array<Record<string, unknown>>;
  const rnd = num(ttm?.researchAndDevelopmentExpenses) ?? trailingSum(q, "researchAndDevelopmentExpenses");
  const sga = num(ttm?.sellingGeneralAndAdministrativeExpenses) ?? trailingSum(q, "sellingGeneralAndAdministrativeExpenses");
  const opex = num(ttm?.operatingExpenses) ?? (rnd != null && sga != null ? rnd + sga : trailingSum(q, "operatingExpenses"));
  const growth = ttmChange(q, "operatingExpenses") ?? yearOverYear(annual[0]?.operatingExpenses, annual[1]?.operatingExpenses);
  const rndShare = opex && rnd != null && opex !== 0 ? rnd / opex : null;
  const sgaShare = opex && sga != null && opex !== 0 ? sga / opex : null;
  const money = compactMoneyFn(reportingCurrency(ttm?.reportedCurrency, annual[0]?.reportedCurrency));
  const windows = [];
  for (let i = 0; i < 16; i++) {
    if (quarterly.length < i + 4) break;
    const end = quarterly[i];
    const research = trailingSum(q, "researchAndDevelopmentExpenses", i);
    const selling = trailingSum(q, "sellingGeneralAndAdministrativeExpenses", i);
    const total = trailingSum(q, "operatingExpenses", i) ?? (research != null && selling != null ? research + selling : null);
    const priorResearch = trailingSum(q, "researchAndDevelopmentExpenses", i + 4);
    const priorSelling = trailingSum(q, "sellingGeneralAndAdministrativeExpenses", i + 4);
    windows.push({
      key: `${end.date}-${end.period}`,
      date: end.date,
      label: `${end.period} ${end.fiscalYear}`,
      research,
      selling,
      total,
      researchGrowth: yearOverYear(research, priorResearch),
      sellingGrowth: yearOverYear(selling, priorSelling),
      researchShare: total && research != null && total !== 0 ? research / total : null,
      sellingShare: total && selling != null && total !== 0 ? selling / total : null,
    });
  }

  return (
    <Container>
      <PageHeader
        title={`${ticker} Operating Expenses`}
        description="Research & development plus selling, general & administrative expense, matching Stock Analysis's operating-expense breakdown."
      />
      <SectionNav items={quoteFundamentalsNav(ticker)} />
      <MetricCards
        items={[
          { label: "Operating Expenses (ttm)", value: money(opex) },
          {
            label: "TTM Growth",
            value: growth == null ? "—" : <ChangePercent value={growth} alreadyPercent={false} className="text-2xl" />,
          },
          { label: "Research & Development", href: stockPath(ticker, "/research-and-development"), value: money(rnd) },
          { label: "SG&A", href: stockPath(ticker, "/sga"), value: money(sga) },
          { label: "R&D Share", value: formatPercentPlain(rndShare) },
          { label: "SG&A Share", value: formatPercentPlain(sgaShare) },
        ]}
      />
      <MetricHistory
        period={period}
        annualHref={path}
        quarterHref={`${path}?period=quarter`}
        title={`${period === "quarter" ? "Quarterly" : "Annual"} Operating Expenses`}
        valueLabel="Operating Expenses"
        formatValue={money}
        empty="No operating expense history available."
        rows={history.map((row) => ({
          key: `${row.date}-${row.period}`,
          date: row.date,
          label: period === "quarter" ? `${row.period} ${row.fiscalYear}` : String(row.fiscalYear),
          value: num(row.operatingExpenses),
        }))}
      />
      <section className="mt-10">
        <h2 className="mb-3 text-lg font-semibold text-header">Operating Expense Breakdown (TTM)</h2>
        <p className="mb-3 text-sm text-muted">
          Each row is a four-quarter window. Growth is versus the same quarter a year earlier.
        </p>
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="sa-table">
            <thead>
              <tr>
                <th>Period Ending</th>
                <th className="num">R&amp;D</th>
                <th className="num">R&amp;D Growth</th>
                <th className="num">SG&amp;A</th>
                <th className="num">SG&amp;A Growth</th>
                <th className="num">Operating Expenses</th>
                <th className="num">R&amp;D %</th>
                <th className="num">SG&amp;A %</th>
              </tr>
            </thead>
            <tbody>
              {windows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-muted">
                    No quarterly operating-expense history available.
                  </td>
                </tr>
              ) : (
                windows.map((row) => (
                  <tr key={row.key}>
                    <td>
                      {row.label}
                      <div className="text-[11px] text-muted">{row.date}</div>
                    </td>
                    <td className="num">{money(row.research)}</td>
                    <td className="num">
                      <ChangePercent value={row.researchGrowth} alreadyPercent={false} />
                    </td>
                    <td className="num">{money(row.selling)}</td>
                    <td className="num">
                      <ChangePercent value={row.sellingGrowth} alreadyPercent={false} />
                    </td>
                    <td className="num">{money(row.total)}</td>
                    <td className="num">{formatPercentPlain(row.researchShare)}</td>
                    <td className="num">{formatPercentPlain(row.sellingShare)}</td>
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
