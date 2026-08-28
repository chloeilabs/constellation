import { Container } from "@/components/container";
import { PageHeader } from "@/components/page-header";
import { SectionNav } from "@/components/section-nav";
import { quoteFundamentalsNav } from "@/lib/nav";
import { MetricCards } from "@/components/metric-cards";
import { MetricHistory } from "@/components/metric-history";
import { ChangePercent } from "@/components/change";
import { compactMoneyFn, reportingCurrency, yearOverYear } from "@/lib/format";
import { getBalanceSheets, getCashFlows, getCashFlowTtm, getIncomeStatements, getIncomeTtm } from "@/lib/fmp";
import { decodeTicker, stockPath } from "@/lib/listings";
import { derivedStatementMetrics, ttmChange } from "@/lib/statements";
import type { StatementPeriod } from "@/lib/types";

function withDerivedIncome<T extends Record<string, unknown>>(row: T): T {
  return { ...row, ...derivedStatementMetrics(row) };
}

export async function StatementMetricPage({
  symbol,
  period,
  slug,
  title,
  description,
  field,
  kind,
  ttmField,
  zeroAsEmpty = false,
}: {
  symbol: string;
  period: StatementPeriod;
  slug: string;
  title: string;
  description: string;
  field: string;
  kind: "income" | "balance" | "cash";
  ttmField?: string;
  zeroAsEmpty?: boolean;
}) {
  const ticker = decodeTicker(symbol);
  const path = stockPath(ticker, `/${slug}`);
  const [annual, quarterly, ttm] = await Promise.all(
    kind === "income"
      ? [getIncomeStatements(ticker, "annual", 20), getIncomeStatements(ticker, "quarter", 12), getIncomeTtm(ticker)]
      : kind === "cash"
        ? [getCashFlows(ticker, "annual", 20), getCashFlows(ticker, "quarter", 12), getCashFlowTtm(ticker)]
        : [getBalanceSheets(ticker, "annual", 20), getBalanceSheets(ticker, "quarter", 12), Promise.resolve(null)],
  );
  const annualRows = kind === "income" ? annual.map((row) => withDerivedIncome(row as Record<string, unknown>)) : annual;
  const quarterlyRows =
    kind === "income" ? quarterly.map((row) => withDerivedIncome(row as Record<string, unknown>)) : quarterly;
  const ttmRow =
    kind === "income" && ttm ? withDerivedIncome(ttm as Record<string, unknown>) : (ttm as Record<string, unknown> | null);
  const history = period === "quarter" ? quarterlyRows : annualRows;
  const latest = history[0] as Record<string, unknown> | undefined;
  const prior = history[1] as Record<string, unknown> | undefined;
  const display = (value: number | null) => (zeroAsEmpty && value === 0 ? null : value);
  const latestValue = display(typeof latest?.[field] === "number" ? (latest[field] as number) : null);
  const priorValue = display(typeof prior?.[field] === "number" ? (prior[field] as number) : null);
  const ttmValue = display(
    ttmRow && ttmField && typeof ttmRow[ttmField] === "number" ? (ttmRow[ttmField] as number) : latestValue,
  );
  const fyGrowth = yearOverYear(latestValue, priorValue);
  const growth =
    (kind === "income" || kind === "cash") && ttmField
      ? ttmChange(quarterlyRows as Array<Record<string, unknown>>, ttmField) ?? fyGrowth
      : fyGrowth;
  const currency = reportingCurrency(typeof latest?.reportedCurrency === "string" ? latest.reportedCurrency : null);
  const money = compactMoneyFn(currency);

  return (
    <Container>
      <PageHeader title={title} description={description} />
      <SectionNav items={quoteFundamentalsNav(ticker)} />
      <MetricCards
        items={[
          { label: ttmField ? "Trailing 12 Months" : "Latest", value: money(ttmValue) },
          {
            label: ttmField ? "TTM Growth" : "Change",
            value: growth == null ? "—" : <ChangePercent value={growth} alreadyPercent={false} className="text-2xl" />,
          },
        ]}
      />
      <MetricHistory
        period={period}
        annualHref={path}
        quarterHref={`${path}?period=quarter`}
        title={`${period === "quarter" ? "Quarterly" : "Annual"} History`}
        valueLabel="Value"
        formatValue={money}
        empty="No history available."
        rows={history.map((row) => {
          const values = row as Record<string, unknown>;
          const raw = typeof values[field] === "number" ? (values[field] as number) : null;
          const date = typeof values.date === "string" ? values.date : "";
          const periodLabel = typeof values.period === "string" ? values.period : "";
          const fiscalYear = values.fiscalYear != null ? String(values.fiscalYear) : "";
          return {
            key: `${date}-${periodLabel}`,
            date,
            label: period === "quarter" ? `${periodLabel} ${fiscalYear}` : fiscalYear,
            value: display(raw),
          };
        })}
      />
    </Container>
  );
}

export function periodFrom(value?: string): StatementPeriod {
  return value === "quarter" ? "quarter" : "annual";
}
