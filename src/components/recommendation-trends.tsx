import type { FmpHistoricalGrade } from "@/lib/types";
import { shortMonthLabel } from "@/lib/forecast";

export function RecommendationMix({ rows }: { rows: FmpHistoricalGrade[] }) {
  const latest = rows.at(-1);
  if (!latest) return null;
  const parts = [
    ["Strong Buy", latest.analystRatingsStrongBuy, "bg-gain"],
    ["Buy", latest.analystRatingsBuy, "bg-gain/70"],
    ["Hold", latest.analystRatingsHold, "bg-chip"],
    ["Sell", latest.analystRatingsSell, "bg-loss/70"],
    ["Strong Sell", latest.analystRatingsStrongSell, "bg-loss"],
  ] as const;
  const total = parts.reduce((sum, [, value]) => sum + value, 0);
  if (total <= 0) return null;
  return (
    <div className="mb-4">
      <div className="flex h-8 overflow-hidden rounded-md border border-border" role="img" aria-label="Analyst rating mix">
        {parts.map(([label, value, color]) =>
          value > 0 ? (
            <div
              key={label}
              className={color}
              style={{ width: `${(value / total) * 100}%` }}
              title={`${label}: ${value}`}
            />
          ) : null,
        )}
      </div>
      <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted">
        {parts.map(([label, value, color]) => (
          <span key={label} className="inline-flex items-center gap-1.5">
            <span className={`h-2 w-2 rounded-sm ${color}`} />
            {label} {value}
          </span>
        ))}
      </div>
    </div>
  );
}

export function RecommendationTrendTable({ rows }: { rows: FmpHistoricalGrade[] }) {
  if (rows.length === 0) {
    return <p className="text-sm text-muted">No historical analyst rating mix available.</p>;
  }
  const line = (label: string, key: keyof FmpHistoricalGrade | "total") => (
    <tr key={label} className={key === "total" ? "font-semibold" : undefined}>
      <td>{label}</td>
      {rows.map((row) => {
        const total =
          row.analystRatingsStrongBuy +
          row.analystRatingsBuy +
          row.analystRatingsHold +
          row.analystRatingsSell +
          row.analystRatingsStrongSell;
        const value = key === "total" ? total : (row[key] as number);
        return (
          <td key={`${row.date}-${label}`} className="num">
            {value}
          </td>
        );
      })}
    </tr>
  );
  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="sa-table">
        <thead>
          <tr>
            <th>Rating</th>
            {rows.map((row) => (
              <th key={row.date} className="num">
                {shortMonthLabel(row.date)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {line("Strong Buy", "analystRatingsStrongBuy")}
          {line("Buy", "analystRatingsBuy")}
          {line("Hold", "analystRatingsHold")}
          {line("Sell", "analystRatingsSell")}
          {line("Strong Sell", "analystRatingsStrongSell")}
          {line("Total", "total")}
        </tbody>
      </table>
    </div>
  );
}
