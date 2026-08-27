"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChangePercent } from "@/components/change";
import { formatCompact, formatPrice } from "@/lib/format";
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

  const { path, area, min, max, width, height, positive, volumes } = useMemo(() => {
    const width = 720;
    const chartHeight = 220;
    const volHeight = 52;
    const gap = 10;
    const height = chartHeight + gap + volHeight;
    const pad = 8;
    if (points.length === 0) {
      return {
        path: "",
        area: "",
        min: 0,
        max: 0,
        width,
        height,
        chartHeight,
        positive: true,
        volumes: [] as { x: number; barWidth: number; barHeight: number; y: number }[],
      };
    }
    const values = points.map((point) => point.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const span = max - min || 1;
    const coords = points.map((point, index) => {
      const x = pad + (index / Math.max(points.length - 1, 1)) * (width - pad * 2);
      const y = pad + ((max - point.value) / span) * (chartHeight - pad * 2);
      return { x, y };
    });
    const path = coords.map((c, i) => `${i === 0 ? "M" : "L"}${c.x.toFixed(2)},${c.y.toFixed(2)}`).join(" ");
    const area = `${path} L${coords.at(-1)!.x.toFixed(2)},${chartHeight - pad} L${coords[0].x.toFixed(2)},${chartHeight - pad} Z`;
    const positive = points[points.length - 1].value >= points[0].value;
    const maxVolume = Math.max(...points.map((point) => point.volume ?? 0), 1);
    const barWidth = Math.max(1, ((width - pad * 2) / Math.max(points.length, 1)) * 0.72);
    const volumes = points.map((point, index) => {
      const x = pad + (index / Math.max(points.length - 1, 1)) * (width - pad * 2) - barWidth / 2;
      const barHeight = ((point.volume ?? 0) / maxVolume) * volHeight;
      return { x, barWidth, barHeight, y: height - barHeight };
    });
    return { path, area, min, max, width, height, chartHeight, positive, volumes };
  }, [points]);

  const active = hover != null ? points[hover] : points.at(-1);
  const start = points[0]?.value;
  const changePct = active && start ? ((active.value - start) / start) * 100 : null;
  const hasVolume = points.some((point) => (point.volume ?? 0) > 0);

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-baseline gap-3">
          <span className="text-2xl font-semibold tabular">{active ? formatPrice(active.value) : "—"}</span>
          <ChangePercent value={changePct} alreadyPercent />
          {active ? <span className="text-xs text-muted">{active.time}</span> : null}
          {hasVolume && active?.volume ? (
            <span className="text-xs text-muted">Vol {formatCompact(active.volume)}</span>
          ) : null}
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
        <div className="flex h-[280px] items-center justify-center rounded-lg border border-dashed border-border text-sm text-muted">
          Chart data is unavailable for this range.
        </div>
      ) : (
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="h-[280px] w-full"
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
          {hasVolume
            ? volumes.map((bar, index) => (
                <rect
                  key={index}
                  x={bar.x}
                  y={bar.y}
                  width={bar.barWidth}
                  height={bar.barHeight}
                  fill={positive ? "#86efac" : "#fca5a5"}
                  opacity={hover == null || hover === index ? 0.95 : 0.35}
                />
              ))
            : null}
          {hover != null && points[hover] ? (
            <line
              x1={8 + (hover / Math.max(points.length - 1, 1)) * (width - 16)}
              x2={8 + (hover / Math.max(points.length - 1, 1)) * (width - 16)}
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
