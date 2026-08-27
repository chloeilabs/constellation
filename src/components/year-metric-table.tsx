import Link from "next/link";
import { DownloadCsvButton } from "@/components/download-csv";
import { ChangePercent } from "@/components/change";
import { formatMillions, formatPrice, formatRatio, formatPercentPlain } from "@/lib/format";

export type YearMetricFormat = "money" | "eps" | "percent" | "ratio" | "margin";

export type YearMetricRow = {
  key: string;
  label: string;
  format: YearMetricFormat;
  href?: string;
  emphasize?: boolean;
};

export type YearMetricColumn = {
  key: string;
  label: string;
  values: Record<string, number | null | undefined>;
};

function formatCell(value: number | null | undefined, format: YearMetricFormat) {
  if (value == null || !Number.isFinite(value)) return "—";
  switch (format) {
    case "money":
      return formatMillions(value);
    case "eps":
      return formatPrice(value);
    case "ratio":
      return formatRatio(value);
    case "percent":
    case "margin":
      return formatPercentPlain(value);
    default:
      return formatMillions(value);
  }
}

export function YearMetricTable({
  columns,
  rows,
  downloadName,
}: {
  columns: YearMetricColumn[];
  rows: YearMetricRow[];
  downloadName?: string;
}) {
  if (columns.length === 0) {
    return <p className="text-sm text-muted">No data available.</p>;
  }

  const csvHeaders = ["Line", ...columns.map((column) => column.label)];
  const csvRows = rows.map((row) => [
    row.label,
    ...columns.map((column) => {
      const value = column.values[row.key];
      return value == null || !Number.isFinite(value) ? "" : value;
    }),
  ]);

  return (
    <div>
      {downloadName ? (
        <div className="mb-2 flex justify-end">
          <DownloadCsvButton filename={downloadName} headers={csvHeaders} rows={csvRows} />
        </div>
      ) : null}
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
            {rows.map((row) => (
              <tr key={row.key} className={row.emphasize ? "bg-muted-bg/60 font-semibold" : undefined}>
                <td>
                  {row.href ? (
                    <Link href={row.href} className="text-link hover:underline">
                      {row.label}
                    </Link>
                  ) : (
                    row.label
                  )}
                </td>
                {columns.map((column) => {
                  const value = column.values[row.key];
                  return (
                    <td key={column.key} className="num">
                      {row.format === "percent" ? (
                        <ChangePercent value={value} alreadyPercent={false} />
                      ) : (
                        formatCell(value, row.format)
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
