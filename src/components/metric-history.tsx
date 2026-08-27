import { PeriodToggle } from "@/components/page-header";
import { HistoryBars } from "@/components/history-bars";
import { ChangePercent } from "@/components/change";
import { formatDate, yearOverYear } from "@/lib/format";

export type HistoryRow = {
  key: string;
  date: string;
  label?: string;
  value: number | null | undefined;
};

export function MetricHistory({
  period,
  annualHref,
  quarterHref,
  title,
  valueLabel,
  rows,
  formatValue,
  empty,
}: {
  period?: "annual" | "quarter";
  annualHref?: string;
  quarterHref?: string;
  title: string;
  valueLabel: string;
  rows: HistoryRow[];
  formatValue: (value: number | null | undefined) => string;
  empty: string;
}) {
  const chartItems = [...rows]
    .reverse()
    .filter((row): row is HistoryRow & { value: number } => typeof row.value === "number" && Number.isFinite(row.value))
    .map((row) => ({
      label: row.label || row.date.slice(0, 4),
      value: row.value,
    }));

  return (
    <>
      {period && annualHref && quarterHref ? (
        <div className="mb-6">
          <PeriodToggle period={period} annualHref={annualHref} quarterHref={quarterHref} />
        </div>
      ) : null}
      {chartItems.length > 1 ? (
        <section className="mt-2">
          <h2 className="mb-3 text-lg font-semibold text-header">{title} Chart</h2>
          <HistoryBars items={chartItems} formatValue={formatValue} />
        </section>
      ) : null}
      <section className="mt-10">
        <h2 className="mb-3 text-lg font-semibold text-header">{title}</h2>
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="sa-table">
            <thead>
              <tr>
                <th>Period</th>
                <th className="num">{valueLabel}</th>
                <th className="num">Change</th>
                <th className="num">Growth</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-muted">
                    {empty}
                  </td>
                </tr>
              ) : (
                rows.map((row, index) => {
                  const prior = rows[index + 1];
                  const current = typeof row.value === "number" ? row.value : null;
                  const previous = typeof prior?.value === "number" ? prior.value : null;
                  const change = current != null && previous != null ? current - previous : null;
                  const growth = yearOverYear(current, previous);
                  return (
                    <tr key={row.key}>
                      <td>{row.label || formatDate(row.date)}</td>
                      <td className="num">{formatValue(current)}</td>
                      <td className="num">{formatValue(change)}</td>
                      <td className="num">
                        <ChangePercent value={growth} alreadyPercent={false} />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
