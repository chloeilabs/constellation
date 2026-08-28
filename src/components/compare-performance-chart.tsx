import Link from "next/link";
import { ChangePercent } from "@/components/change";
import { formatNumber } from "@/lib/format";
import { quoteHref } from "@/lib/listings";
import type { ChartPoint } from "@/lib/types";
import { cn } from "@/lib/utils";

const COLORS = ["#16a34a", "#4f46e5", "#d97706", "#e11d48"];

function stamp(time: string) {
  const day = time.slice(0, 10);
  const parsed = Date.parse(`${day}T00:00:00Z`);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function ComparePerformanceChart({
  series,
  span,
  oneHref,
  fiveHref,
}: {
  series: { symbol: string; points: ChartPoint[] }[];
  span: "1Y" | "5Y";
  oneHref: string;
  fiveHref: string;
}) {
  const lines = series
    .map((row, index) => ({ ...row, color: COLORS[index % COLORS.length] }))
    .filter((row) => row.points.length >= 2);
  if (lines.length === 0) {
    return <p className="text-sm text-muted">Not enough daily closes to draw a comparison chart.</p>;
  }

  const times = lines.flatMap((row) => row.points.map((point) => stamp(point.time)));
  const values = lines.flatMap((row) => row.points.map((point) => point.value));
  const tMin = Math.min(...times);
  const tMax = Math.max(...times);
  const vMin = Math.min(...values, 90);
  const vMax = Math.max(...values, 110);
  const width = 720;
  const height = 280;
  const pad = 12;
  const spanMs = Math.max(tMax - tMin, 1);
  const yOf = (value: number) => pad + ((vMax - value) / Math.max(vMax - vMin, 1)) * (height - pad * 2);
  const xOf = (time: string) => pad + ((stamp(time) - tMin) / spanMs) * (width - pad * 2);

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-header">Total Return (%)</h2>
          <p className="mt-1 text-sm text-muted">
            Dividend-adjusted closes from FMP. Each series starts at 100 on the first overlapping close in this window.
          </p>
        </div>
        <div className="inline-flex rounded-md border border-border p-0.5 text-sm" role="group" aria-label="Chart range">
          <Link
            href={oneHref}
            scroll={false}
            className={cn(
              "rounded px-3 py-1.5 font-medium",
              span === "1Y" ? "bg-header text-on-header" : "text-muted hover:text-header",
            )}
          >
            1Y
          </Link>
          <Link
            href={fiveHref}
            scroll={false}
            className={cn(
              "rounded px-3 py-1.5 font-medium",
              span === "5Y" ? "bg-header text-on-header" : "text-muted hover:text-header",
            )}
          >
            5Y
          </Link>
        </div>
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} className="h-[280px] w-full">
        <line x1={pad} x2={width - pad} y1={yOf(100)} y2={yOf(100)} stroke="#94a3b8" strokeDasharray="4 4" strokeWidth="1" />
        {lines.map((row) => {
          const d = row.points
            .map((point, index) => `${index === 0 ? "M" : "L"}${xOf(point.time).toFixed(2)},${yOf(point.value).toFixed(2)}`)
            .join(" ");
          return <path key={row.symbol} d={d} fill="none" stroke={row.color} strokeWidth="2" />;
        })}
      </svg>
      <div className="mt-3 flex flex-wrap gap-4 text-sm">
        {lines.map((row) => {
          const last = row.points.at(-1)?.value;
          const change = last != null ? last / 100 - 1 : null;
          return (
            <div key={row.symbol} className="inline-flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-sm" style={{ background: row.color }} />
              <Link href={quoteHref(row.symbol)} className="font-medium text-link hover:underline">
                {row.symbol}
              </Link>
              <span className="tabular text-muted">{last != null ? formatNumber(last) : "—"}</span>
              <ChangePercent value={change} alreadyPercent={false} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
