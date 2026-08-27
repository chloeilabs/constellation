import {
  changeClass,
  formatCompact,
  formatCompactMoney,
  formatMillions,
  formatNumber,
  formatPercent,
  formatPercentPlain,
  formatPrice,
  yearOverYear,
} from "@/lib/format";
import { cn } from "@/lib/utils";
import type { StatementRow } from "@/lib/statements";

function formatCell(
  value: unknown,
  format: StatementRow["format"],
  scale?: "millions",
  currency?: string | null,
) {
  if (typeof value !== "number" || Number.isNaN(value)) return "—";
  switch (format) {
    case "money":
      return scale === "millions" ? formatMillions(value) : formatCompactMoney(value, currency);
    case "share":
      return scale === "millions" ? formatMillions(value) : formatCompact(value);
    case "eps":
      return formatPrice(value);
    case "percent":
      return formatPercentPlain(value);
    case "ratio":
    case "number":
      return formatNumber(value);
    default:
      return scale === "millions" ? formatMillions(value) : formatCompactMoney(value, currency);
  }
}

export function StatementTable({
  rows,
  columns,
  scale,
  caption,
  currency,
}: {
  rows: StatementRow[];
  columns: { key: string; label: string; values: Record<string, unknown> }[];
  scale?: "millions";
  caption?: string;
  currency?: string | null;
}) {
  if (columns.length === 0) {
    return <p className="text-sm text-muted">No statement data available for this period.</p>;
  }

  return (
    <div>
      {caption ? <p className="mb-2 text-xs text-muted">{caption}</p> : null}
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="sa-table sa-statement">
          <thead>
            <tr>
              <th>Fiscal Year</th>
              {columns.map((column) => (
                <th key={column.key} className="num">
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const showYoy = row.format === "money" || row.format === "share";
              return (
                <tr key={row.key} className={row.emphasize ? "bg-muted-bg/60 font-semibold" : undefined}>
                  <td
                    className="whitespace-normal"
                    style={{ paddingLeft: `${12 + (row.indent ?? 0) * 16}px` }}
                  >
                    {row.label}
                  </td>
                  {columns.map((column, index) => {
                    const value = column.values[row.key];
                    const previous = columns[index + 1]?.values[row.key];
                    const yoy = showYoy && column.label !== "TTM" ? yearOverYear(value, previous) : null;
                    const text = formatCell(value, row.format, scale, currency);
                    return (
                      <td key={column.key} className={cn("num align-top", text === "—" ? "text-muted" : "")}>
                        <div>{text}</div>
                        {yoy != null ? (
                          <div className={cn("text-[11px] font-medium", changeClass(yoy))}>
                            {formatPercent(yoy)}
                          </div>
                        ) : null}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
