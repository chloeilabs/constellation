import { ChangePercent } from "@/components/change";
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

export function ReturnsTable({ changes }: { changes: FmpPriceChange | null }) {
  if (!changes) return null;
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
                <ChangePercent value={changes[key]} />
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );
}
