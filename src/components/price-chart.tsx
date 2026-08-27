"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChangePercent } from "@/components/change";
import { formatPrice } from "@/lib/format";
import { CHART_RANGES, type ChartRange } from "@/lib/chart";
import type { ChartPoint } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useMemo, useState } from "react";

export function PriceChart({
  points,
  range,
  symbol,
}: {
  points: ChartPoint[];
  range: ChartRange;
  symbol: string;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const pathname = usePathname();

  const { path, area, min, max, width, height, positive } = useMemo(() => {
    const width = 720;
    const height = 260;
    const pad = 8;
    if (points.length === 0) {
      return { path: "", area: "", min: 0, max: 0, width, height, positive: true };
    }
    const values = points.map((point) => point.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const span = max - min || 1;
    const coords = points.map((point, index) => {
      const x = pad + (index / Math.max(points.length - 1, 1)) * (width - pad * 2);
      const y = pad + ((max - point.value) / span) * (height - pad * 2);
      return { x, y };
    });
    const path = coords.map((c, i) => `${i === 0 ? "M" : "L"}${c.x.toFixed(2)},${c.y.toFixed(2)}`).join(" ");
    const area = `${path} L${coords.at(-1)!.x.toFixed(2)},${height - pad} L${coords[0].x.toFixed(2)},${height - pad} Z`;
    const positive = points[points.length - 1].value >= points[0].value;
    return { path, area, min, max, width, height, positive };
  }, [points]);

  const active = hover != null ? points[hover] : points.at(-1);
  const start = points[0]?.value;
  const changePct = active && start ? ((active.value - start) / start) * 100 : null;

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-baseline gap-3">
          <span className="text-2xl font-semibold tabular">{active ? formatPrice(active.value) : "—"}</span>
          <ChangePercent value={changePct} alreadyPercent />
          {active ? <span className="text-xs text-muted">{active.time}</span> : null}
        </div>
        <div className="flex flex-wrap gap-1">
          {CHART_RANGES.map((item) => (
            <Link
              key={item}
              href={`${pathname}?range=${item}`}
              scroll={false}
              className={cn(
                "rounded px-2 py-1 text-xs font-semibold",
                item === range ? "bg-header text-white" : "text-muted hover:bg-muted-bg",
              )}
            >
              {item}
            </Link>
          ))}
        </div>
      </div>
      {points.length === 0 ? (
        <div className="flex h-[260px] items-center justify-center rounded-lg border border-dashed border-border text-sm text-muted">
          Chart data is unavailable for this range.
        </div>
      ) : (
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="h-[260px] w-full"
          onMouseLeave={() => setHover(null)}
          onMouseMove={(event) => {
            const rect = event.currentTarget.getBoundingClientRect();
            const ratio = (event.clientX - rect.left) / rect.width;
            const index = Math.min(points.length - 1, Math.max(0, Math.round(ratio * (points.length - 1))));
            setHover(index);
          }}
        >
          <defs>
            <linearGradient id={`chartFill-${symbol}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={positive ? "#16a34a" : "#dc2626"} stopOpacity="0.28" />
              <stop offset="100%" stopColor={positive ? "#16a34a" : "#dc2626"} stopOpacity="0.02" />
            </linearGradient>
          </defs>
          <path d={area} fill={`url(#chartFill-${symbol})`} />
          <path d={path} fill="none" stroke={positive ? "#16a34a" : "#dc2626"} strokeWidth="2" />
          {hover != null && points[hover] ? (
            <line
              x1={(hover / Math.max(points.length - 1, 1)) * width}
              x2={(hover / Math.max(points.length - 1, 1)) * width}
              y1="0"
              y2={height}
              stroke="#94a3b8"
              strokeDasharray="3 3"
            />
          ) : null}
        </svg>
      )}
      <div className="mt-1 flex justify-between text-xs text-muted">
        <span>{formatPrice(min)}</span>
        <Link href={`/stocks/${encodeURIComponent(symbol)}/chart`} className="text-link hover:underline">
          Full Chart
        </Link>
        <span>{formatPrice(max)}</span>
      </div>
    </div>
  );
}
