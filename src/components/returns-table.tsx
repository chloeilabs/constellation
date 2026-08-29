import { ChangePercent } from "@/components/change";
import type { VehiclePerformance } from "@/lib/chart";
import type { FmpPriceChange } from "@/lib/types";

const PERIODS = [
  ["1D", "1D"],
  ["5D", "5D"],
  ["1M", "1M"],
  ["YTD", "ytd"],
  ["3M", "3M"],
  ["6M", "6M"],
  ["1Y", "1Y"],
  ["5Y", "5Y"],
  ["MAX", "max"],
] as const;

type PeriodKey = (typeof PERIODS)[number][1];

function asPercent(value: number | null | undefined) {
  return typeof value === "number" && Number.isFinite(value) ? value * 100 : null;
}

/** Overlay total return from FMP adjClose onto FMP's price-only snapshot. */
function withAdjustedTotals(changes: FmpPriceChange | null, performance?: VehiclePerformance | null) {
  if (!performance) return changes;
  const overlay: Partial<Record<PeriodKey, number>> = {};
  const oneMonth = asPercent(performance.oneMonth);
  const threeMonth = asPercent(performance.threeMonth);
  const sixMonth = asPercent(performance.sixMonth);
  const ytd = asPercent(performance.ytd);
  const oneYear = asPercent(performance.oneYear);
  const fiveYear = asPercent(performance.fiveYearTotal);
  const max = asPercent(performance.inceptionTotal);
  if (oneMonth != null) overlay["1M"] = oneMonth;
  if (threeMonth != null) overlay["3M"] = threeMonth;
  if (sixMonth != null) overlay["6M"] = sixMonth;
  if (ytd != null) overlay.ytd = ytd;
  if (oneYear != null) overlay["1Y"] = oneYear;
  if (fiveYear != null) overlay["5Y"] = fiveYear;
  if (max != null) overlay.max = max;
  if (!changes) {
    return Object.keys(overlay).length ? ({ symbol: "", ...overlay } as FmpPriceChange) : null;
  }
  return { ...changes, ...overlay };
}

export function ReturnsTable({
  changes,
  performance,
}: {
  changes: FmpPriceChange | null;
  performance?: VehiclePerformance | null;
}) {
  const row = withAdjustedTotals(changes, performance);
  if (!row) return null;
  return (
    <div className="mt-6 overflow-x-auto rounded-lg border border-border">
      <table className="sa-table">
        <thead>
          <tr>
            {PERIODS.map(([label]) => (
              <th key={label} className="num">
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            {PERIODS.map(([label, key]) => (
              <td key={label} className="num">
                <ChangePercent value={row[key]} />
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );
}
