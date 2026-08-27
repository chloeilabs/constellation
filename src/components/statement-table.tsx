import {
  formatCompactUsd,
  formatNumber,
  formatPercentPlain,
  formatPrice,
} from "@/lib/format";
import { cn } from "@/lib/utils";
import type { StatementRow } from "@/lib/statements";

function formatCell(
  value: unknown,
  format: StatementRow["format"],
) {
  if (typeof value !== "number" || Number.isNaN(value)) return "—";
  switch (format) {
    case "money":
      return formatCompactUsd(value);
    case "share":
      return formatCompactUsd(value).replace("$", "");
    case "eps":
      return formatPrice(value);
    case "percent":
      return formatPercentPlain(value);
    case "ratio":
    case "number":
      return formatNumber(value);
    default:
      return formatCompactUsd(value);
  }
}

export function StatementTable({
  rows,
  columns,
}: {
  rows: StatementRow[];
  columns: { key: string; label: string; values: Record<string, unknown> }[];
}) {
  if (columns.length === 0) {
    return <p className="text-sm text-muted">No statement data available for this period.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="sa-table sa-statement">
        <thead>
          <tr>
            <th>Line item</th>
            {columns.map((column) => (
              <th key={column.key} className="num">
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.key} className={row.emphasize ? "bg-muted-bg/60 font-semibold" : undefined}>
              <td style={{ paddingLeft: `${12 + (row.indent ?? 0) * 16}px` }}>{row.label}</td>
              {columns.map((column) => (
                <td key={column.key} className={cn("num", formatCell(column.values[row.key], row.format) === "—" ? "text-muted" : "")}>
                  {formatCell(column.values[row.key], row.format)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
