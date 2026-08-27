"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChangePercent } from "@/components/change";
import { formatCompact, formatPrice } from "@/lib/format";
import { CHART_RANGES, type ChartRange } from "@/lib/chart-range";
import type { ChartPoint } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useMemo, useState } from "react";

function seriesByDay(series?: ChartPoint[]) {
  const map = new Map<string, number>();
  if (!series) return map;
  for (const point of series) {
    if (typeof point.value === "number" && Number.isFinite(point.value)) {
      map.set(point.time.slice(0, 10), point.value);
    }
  }
  return map;
}

function alignedPath(
  points: ChartPoint[],
  byDay: Map<string, number>,
  yOf: (value: number) => number,
  pad: number,
  width: number,
) {
  const coords: { x: number; y: number }[] = [];
  const last = Math.max(points.length - 1, 1);
  points.forEach((point, index) => {
    const value = byDay.get(point.time.slice(0, 10));
    if (value == null) return;
    coords.push({
      x: pad + (index / last) * (width - pad * 2),
      y: yOf(value),
    });
  });
  if (coords.length < 2) return "";
  return coords.map((c, i) => `${i === 0 ? "M" : "L"}${c.x.toFixed(2)},${c.y.toFixed(2)}`).join(" ");
}

export function PriceChart({
  points,
  range,
  symbol,
  chartHref,
  ma50,
  ma200,
  ma50Series,
  ma200Series,
}: {
  points: ChartPoint[];
  range: ChartRange;
  symbol: string;
  chartHref?: string;
  ma50?: number | null;
  ma200?: number | null;
  ma50Series?: ChartPoint[];
  ma200Series?: ChartPoint[];
}) {
  const [hover, setHover] = useState<number | null>(null);
  const pathname = usePathname();

  const { path, area, min, max, width, height, positive, volumes, ma50Y, ma200Y, ma50Path, ma200Path, ma50Days, ma200Days } = useMemo(() => {
    const width = 720;
    const chartHeight = 220;
    const volHeight = 52;
    const gap = 10;
    const height = chartHeight + gap + volHeight;
    const pad = 8;
    const ma50Days = seriesByDay(ma50Series);
    const ma200Days = seriesByDay(ma200Series);
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
        ma50Y: null as number | null,
        ma200Y: null as number | null,
        ma50Path: "",
        ma200Path: "",
        ma50Days,
        ma200Days,
      };
    }
    const values = points.map((point) => point.value);
    const extras = [ma50, ma200].filter((value): value is number => typeof value === "number" && Number.isFinite(value));
    for (const point of points) {
      const day = point.time.slice(0, 10);
      const sma50 = ma50Days.get(day);
      const sma200 = ma200Days.get(day);
      if (sma50 != null) extras.push(sma50);
      if (sma200 != null) extras.push(sma200);
    }
    const min = Math.min(...values, ...extras);
    const max = Math.max(...values, ...extras);
    const span = max - min || 1;
    const yOf = (value: number) => pad + ((max - value) / span) * (chartHeight - pad * 2);
    const coords = points.map((point, index) => {
      const x = pad + (index / Math.max(points.length - 1, 1)) * (width - pad * 2);
      const y = yOf(point.value);
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
    const ma50Path = alignedPath(points, ma50Days, yOf, pad, width);
    const ma200Path = alignedPath(points, ma200Days, yOf, pad, width);
    return {
      path,
      area,
      min,
      max,
      width,
      height,
      chartHeight,
      positive,
      volumes,
      ma50Y: !ma50Path && typeof ma50 === "number" && Number.isFinite(ma50) ? yOf(ma50) : null,
      ma200Y: !ma200Path && typeof ma200 === "number" && Number.isFinite(ma200) ? yOf(ma200) : null,
      ma50Path,
      ma200Path,
      ma50Days,
      ma200Days,
    };
  }, [points, ma50, ma200, ma50Series, ma200Series]);

  const active = hover != null ? points[hover] : points.at(-1);
  const start = points[0]?.value;
  const changePct = active && start ? ((active.value - start) / start) * 100 : null;
  const hasVolume = points.some((point) => (point.volume ?? 0) > 0);
  const activeDay = active?.time.slice(0, 10);
  const ma50Now = (activeDay ? ma50Days.get(activeDay) : undefined) ?? ma50;
  const ma200Now = (activeDay ? ma200Days.get(activeDay) : undefined) ?? ma200;

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
          {typeof ma50Now === "number" ? (
            <span className="text-xs font-medium text-amber-600">MA50 {formatPrice(ma50Now)}</span>
          ) : null}
          {typeof ma200Now === "number" ? (
            <span className="text-xs font-medium text-indigo-600">MA200 {formatPrice(ma200Now)}</span>
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
          {ma50Path ? <path d={ma50Path} fill="none" stroke="#d97706" strokeWidth="1.5" /> : null}
          {ma200Path ? <path d={ma200Path} fill="none" stroke="#4f46e5" strokeWidth="1.5" /> : null}
          {ma50Y != null ? (
            <line x1="8" x2={width - 8} y1={ma50Y} y2={ma50Y} stroke="#d97706" strokeDasharray="5 4" strokeWidth="1.25" />
          ) : null}
          {ma200Y != null ? (
            <line x1="8" x2={width - 8} y1={ma200Y} y2={ma200Y} stroke="#4f46e5" strokeDasharray="5 4" strokeWidth="1.25" />
          ) : null}
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
        <Link href={chartHref ?? `/stocks/${encodeURIComponent(symbol)}/chart`} className="text-link hover:underline">
          Full Chart
        </Link>
        <span>{formatPrice(max)}</span>
      </div>
    </div>
  );
}
