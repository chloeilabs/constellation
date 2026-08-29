import Link from "next/link";
import { Container } from "@/components/container";
import { FundamentalOverlayChart } from "@/components/fundamental-overlay-chart";
import { PageHeader, PeriodToggle } from "@/components/page-header";
import { ChangePercent } from "@/components/change";
import {
  compactMoneyFn,
  formatCompact,
  formatPercentPlain,
  formatPrice,
  formatRatio,
  formatUsd,
  reportingCurrency,
  yearOverYear,
} from "@/lib/format";
import { getBalanceSheets, getCashFlows, getDailyChart, getIncomeStatements, getProfile } from "@/lib/fmp";
import {
  closeOnOrBefore,
  fundamentalMetricGroups,
  resolveFundamentalMetric,
  toCloseSeries,
} from "@/lib/fundamental-chart";
import { decodeTicker, displayCompanyName, stockPath } from "@/lib/listings";
import { historyLabel, loadPeriodValuationHistory, priceFromForFilings } from "@/lib/period-valuation";
import { derivedBalanceMetrics, derivedStatementMetrics, filingLimit, STATEMENT_METRIC_HREFS } from "@/lib/statements";
import { cn } from "@/lib/utils";

export default async function FundamentalChartPage({
  params,
  searchParams,
}: {
  params: Promise<{ symbol: string }>;
  searchParams: Promise<{ metric?: string; period?: string }>;
}) {
  const { symbol } = await params;
  const { metric: metricParam, period: periodParam } = await searchParams;
  const ticker = decodeTicker(symbol);
  const period = periodParam === "quarter" ? "quarter" : "annual";
  const metric = resolveFundamentalMetric(metricParam);
  const base = stockPath(ticker, "/fundamental-chart");
  const limit = filingLimit(period);
  const priceFrom = priceFromForFilings(period, limit);
  const usesFilings = metric.source === "ratios" || metric.source === "metrics";
  const [profile, rows, candles] = await Promise.all([
    getProfile(ticker),
    metric.source === "income"
      ? getIncomeStatements(ticker, period, limit)
      : metric.source === "cash"
        ? getCashFlows(ticker, period, limit)
        : metric.source === "balance"
          ? getBalanceSheets(ticker, period, limit)
          : loadPeriodValuationHistory(ticker, period, limit),
    usesFilings ? Promise.resolve([]) : getDailyChart(ticker, priceFrom),
  ]);
  const history = [...rows].sort((a, b) => String(a.date).localeCompare(String(b.date))) as Array<
    Record<string, unknown> & { date: string; fiscalYear?: string | number; period?: string; lastClosePrice?: number | null }
  >;
  const prices = toCloseSeries(candles);
  const items = history.map((row) => {
    const values =
      metric.source === "income"
        ? { ...row, ...derivedStatementMetrics(row as Record<string, unknown>) }
        : metric.source === "balance"
          ? { ...row, ...derivedBalanceMetrics(row as Record<string, unknown>) }
          : (row as Record<string, unknown>);
    const raw = values[metric.field];
    const value = typeof raw === "number" && Number.isFinite(raw) ? raw : null;
    const date = String(row.date ?? "");
    const price =
      usesFilings && typeof row.lastClosePrice === "number" && Number.isFinite(row.lastClosePrice)
        ? row.lastClosePrice
        : closeOnOrBefore(prices, date);
    return {
      date,
      label: historyLabel(row, period),
      metric: value,
      price,
    };
  });
  const latest = items.at(-1);
  const prior = items.at(-2);
  const growth = yearOverYear(latest?.metric ?? null, prior?.metric ?? null);
  const currency = reportingCurrency(profile?.currency, (history[0] as { reportedCurrency?: string } | undefined)?.reportedCurrency);
  const money = compactMoneyFn(currency);
  const formatMetric = (value: number | null | undefined) => {
    if (value == null || Number.isNaN(value)) return "—";
    if (metric.format === "percent") return formatPercentPlain(value);
    if (metric.format === "eps") return formatPrice(value);
    if (metric.format === "share") return formatCompact(value);
    if (metric.format === "ratio") return formatRatio(value);
    return money(value);
  };
  const shortName = displayCompanyName(profile?.companyName) || ticker;
  const detailSlug = STATEMENT_METRIC_HREFS[metric.field];
  const groups = fundamentalMetricGroups();
  const periodQuery = period === "quarter" ? "&period=quarter" : "";

  return (
    <Container>
      <PageHeader
        title={`${shortName} Fundamental Chart`}
        description={`${metric.label} from live FMP ${period === "quarter" ? "quarterly" : "annual"} filings, with the last close on or before each period end.`}
        actions={
          <PeriodToggle
            period={period}
            annualHref={`${base}?metric=${metric.id}`}
            quarterHref={`${base}?metric=${metric.id}&period=quarter`}
          />
        }
      />
      <div className="flex flex-col gap-5">
        {groups.map((group) => (
          <div key={group.title}>
            <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">{group.title}</div>
            <div className="flex flex-wrap gap-1.5">
              {group.metrics.map((item) => (
                <Link
                  key={item.id}
                  href={`${base}?metric=${item.id}${periodQuery}`}
                  scroll={false}
                  className={cn(
                    "rounded-full px-3 py-1 text-sm font-medium",
                    item.id === metric.id ? "bg-brand text-white" : "bg-chip text-header hover:bg-border",
                  )}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-border p-4">
          <div className="text-sm text-muted">Latest {metric.label}</div>
          <div className="mt-1 text-2xl font-semibold tabular">{formatMetric(latest?.metric)}</div>
          <p className="mt-1 text-xs text-muted">{latest?.label ?? "—"}</p>
        </div>
        <div className="rounded-lg border border-border p-4">
          <div className="text-sm text-muted">Change</div>
          <div className="mt-1 text-2xl font-semibold tabular">
            {growth == null ? "—" : <ChangePercent value={growth} alreadyPercent={false} className="text-2xl" />}
          </div>
          <p className="mt-1 text-xs text-muted">Versus the prior period</p>
        </div>
        <div className="rounded-lg border border-border p-4">
          <div className="text-sm text-muted">Period-end close</div>
          <div className="mt-1 text-2xl font-semibold tabular">{formatUsd(latest?.price)}</div>
          <p className="mt-1 text-xs text-muted">{latest?.date ? latest.date.slice(0, 10) : "—"}</p>
        </div>
      </div>

      <section className="mt-8">
        <div className="mb-3 flex items-end justify-between gap-3">
          <h2 className="text-lg font-semibold text-header">{metric.label}</h2>
          {detailSlug ? (
            <Link href={stockPath(ticker, `/${detailSlug}`)} className="text-sm text-link hover:underline">
              {metric.label} page
            </Link>
          ) : null}
        </div>
        <FundamentalOverlayChart
          items={items}
          formatMetric={(value) => formatMetric(value)}
          formatPrice={(value) => formatUsd(value)}
        />
      </section>

      <section className="mt-10">
        <h2 className="mb-3 text-lg font-semibold text-header">History</h2>
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="sa-table">
            <thead>
              <tr>
                <th>Period</th>
                <th className="num">{metric.label}</th>
                <th className="num">Growth</th>
                <th className="num">Close</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-muted">
                    No history available for {metric.label}.
                  </td>
                </tr>
              ) : (
                [...items].reverse().map((row, index, list) => {
                  const older = list[index + 1];
                  return (
                    <tr key={`${row.date}-${row.label}`}>
                      <td>{row.label}</td>
                      <td className="num">{formatMetric(row.metric)}</td>
                      <td className="num">
                        <ChangePercent value={yearOverYear(row.metric, older?.metric ?? null)} alreadyPercent={false} />
                      </td>
                      <td className="num">{formatUsd(row.price)}</td>
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
