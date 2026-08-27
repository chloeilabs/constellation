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
import { ttmChange } from "@/lib/statements";
import type { StatementPeriod } from "@/lib/types";

export async function StatementMetricPage({
  symbol,
  period,
  slug,
  title,
  description,
  field,
  kind,
  ttmField,
}: {
  symbol: string;
  period: StatementPeriod;
  slug: string;
  title: string;
  description: string;
  field: string;
  kind: "income" | "balance" | "cash";
  ttmField?: string;
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
  const history = period === "quarter" ? quarterly : annual;
  const latest = history[0] as Record<string, unknown> | undefined;
  const prior = history[1] as Record<string, unknown> | undefined;
  const latestValue = typeof latest?.[field] === "number" ? (latest[field] as number) : null;
  const priorValue = typeof prior?.[field] === "number" ? (prior[field] as number) : null;
  const ttmValue =
    ttm && ttmField && typeof (ttm as Record<string, unknown>)[ttmField] === "number"
      ? ((ttm as Record<string, unknown>)[ttmField] as number)
      : latestValue;
  const fyGrowth = yearOverYear(latestValue, priorValue);
  const growth =
    (kind === "income" || kind === "cash") && ttmField
      ? ttmChange(quarterly as Array<Record<string, unknown>>, ttmField) ?? fyGrowth
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
          return {
            key: `${row.date}-${row.period}`,
            date: row.date,
            label: period === "quarter" ? `${row.period} ${row.fiscalYear}` : String(row.fiscalYear),
            value: typeof values[field] === "number" ? (values[field] as number) : null,
          };
        })}
      />
    </Container>
  );
}

export function periodFrom(value?: string): StatementPeriod {
  return value === "quarter" ? "quarter" : "annual";
}
