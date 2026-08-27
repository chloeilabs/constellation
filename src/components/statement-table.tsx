import { DownloadCsvButton } from "@/components/download-csv";
import {
  changeClass,
  formatCompact,
  formatCompactMoney,
  formatDate,
  formatMillions,
  formatNumber,
  formatPercent,
  formatPercentPlain,
  formatPrice,
  yearOverYear,
} from "@/lib/format";
import { cn } from "@/lib/utils";
import type { StatementRow } from "@/lib/statements";

function formatCommonSize(value: unknown, base: unknown) {
  if (typeof value !== "number" || typeof base !== "number" || !Number.isFinite(value) || !Number.isFinite(base) || base === 0) {
    return "—";
  }
  return formatPercentPlain(value / base);
}

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
    case "growth":
      return formatPercent(value);
    case "ratio":
    case "number":
      return formatNumber(value);
    default:
      return scale === "millions" ? formatMillions(value) : formatCompactMoney(value, currency);
  }
}

function csvValue(
  value: unknown,
  format: StatementRow["format"],
  scale: "millions" | undefined,
  commonSizeBase: string | undefined,
  base: unknown,
) {
  const asPercent = Boolean(commonSizeBase) && (format === "money" || !format);
  if (asPercent) {
    if (typeof value !== "number" || typeof base !== "number" || !Number.isFinite(value) || !Number.isFinite(base) || base === 0) {
      return "";
    }
    return Number(((value / base) * 100).toFixed(4));
  }
  if (typeof value !== "number" || !Number.isFinite(value)) return "";
  if ((format === "money" || format === "share" || !format) && scale === "millions") {
    return Number((value / 1e6).toFixed(4));
  }
  return value;
}

function periodEnd(values: Record<string, unknown>) {
  const raw = values.date;
  return typeof raw === "string" && raw ? formatDate(raw) : null;
}

export function StatementTable({
  rows,
  columns,
  scale,
  caption,
  currency,
  commonSizeBase,
  downloadName,
  inlineYoy = true,
}: {
  rows: StatementRow[];
  columns: { key: string; label: string; values: Record<string, unknown> }[];
  scale?: "millions";
  caption?: string;
  currency?: string | null;
  commonSizeBase?: string;
  downloadName?: string;
  inlineYoy?: boolean;
}) {
  if (columns.length === 0) {
    return <p className="text-sm text-muted">No statement data available for this period.</p>;
  }

  const csvHeaders = ["Line", ...columns.map((column) => column.label)];
  const csvRows = rows.map((row) => [
    row.label,
    ...columns.map((column) =>
      csvValue(column.values[row.key], row.format, scale, commonSizeBase, commonSizeBase ? column.values[commonSizeBase] : null),
    ),
  ]);

  return (
    <div>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
        {caption ? <p className="text-xs text-muted">{caption}</p> : <span />}
        {downloadName ? <DownloadCsvButton filename={downloadName} headers={csvHeaders} rows={csvRows} /> : null}
      </div>
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="sa-table sa-statement">
          <thead>
            <tr>
              <th>Fiscal Year</th>
              {columns.map((column) => {
                const ended = periodEnd(column.values);
                return (
                  <th key={column.key} className="num">
                    <div>{column.label}</div>
                    {ended ? <div className="text-[11px] font-normal text-muted">{ended}</div> : null}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const asPercent = Boolean(commonSizeBase) && (row.format === "money" || !row.format);
              const showYoy = inlineYoy && !asPercent && (row.format === "money" || row.format === "share");
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
                    const text = asPercent && commonSizeBase
                      ? formatCommonSize(value, column.values[commonSizeBase])
                      : formatCell(value, row.format, scale, currency);
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
