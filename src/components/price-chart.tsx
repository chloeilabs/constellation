"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChangePercent } from "@/components/change";
import { formatCompact, formatNumber, formatPrice } from "@/lib/format";
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

function chartSearch(query: Record<string, string | undefined> | undefined, range: string, extra?: Record<string, string | undefined>) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries({ ...query, range, ...extra })) {
    if (value) params.set(key, value);
  }
  const qs = params.toString();
  return qs ? `?${qs}` : "";
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
  ema12Series,
  ema26Series,
  rsiSeries,
  macdSeries,
  macdSignalSeries,
  macdHistogramSeries,
  query,
  adjusted,
  showAdjustedToggle = false,
}: {
  points: ChartPoint[];
  range: ChartRange;
  symbol: string;
  chartHref?: string;
  ma50?: number | null;
  ma200?: number | null;
  ma50Series?: ChartPoint[];
  ma200Series?: ChartPoint[];
  ema12Series?: ChartPoint[];
  ema26Series?: ChartPoint[];
  rsiSeries?: ChartPoint[];
  macdSeries?: ChartPoint[];
  macdSignalSeries?: ChartPoint[];
  macdHistogramSeries?: ChartPoint[];
  query?: Record<string, string | undefined>;
  adjusted?: boolean;
  showAdjustedToggle?: boolean;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const pathname = usePathname();
  const showRsi = (rsiSeries?.length ?? 0) > 1;
  const showMacd = (macdSeries?.length ?? 0) > 1;

  const layout = useMemo(() => {
    const width = 720;
    const oscillators = (showRsi ? 1 : 0) + (showMacd ? 1 : 0);
    const chartHeight = oscillators ? 188 : 220;
    const volHeight = oscillators ? 40 : 52;
    const rsiHeight = 52;
    const macdHeight = 56;
    const gap = 8;
    const pad = 8;
    const volTop = chartHeight + gap;
    const rsiTop = volTop + volHeight + gap;
    const macdTop = showRsi ? rsiTop + rsiHeight + gap : rsiTop;
    const height = showMacd ? macdTop + macdHeight : showRsi ? rsiTop + rsiHeight : volTop + volHeight;
    const ma50Days = seriesByDay(ma50Series);
    const ma200Days = seriesByDay(ma200Series);
    const ema12Days = seriesByDay(ema12Series);
    const ema26Days = seriesByDay(ema26Series);
    const rsiDays = seriesByDay(rsiSeries);
    const macdDays = seriesByDay(macdSeries);
    const macdSignalDays = seriesByDay(macdSignalSeries);
    const macdHistDays = seriesByDay(macdHistogramSeries);
    const empty = {
      path: "",
      area: "",
      min: 0,
      max: 0,
      width,
      height,
      positive: true,
      volumes: [] as { x: number; barWidth: number; barHeight: number; y: number }[],
      macdBars: [] as { x: number; y: number; barWidth: number; barHeight: number; up: boolean }[],
      ma50Y: null as number | null,
      ma200Y: null as number | null,
      ma50Path: "",
      ma200Path: "",
      ema12Path: "",
      ema26Path: "",
      rsiPath: "",
      rsi30Y: 0,
      rsi50Y: 0,
      rsi70Y: 0,
      macdPath: "",
      macdSignalPath: "",
      macdZeroY: 0,
      ma50Days,
      ma200Days,
      ema12Days,
      ema26Days,
      rsiDays,
      macdDays,
      macdSignalDays,
    };
    if (points.length === 0) return empty;

    const values = points.map((point) => point.value);
    const priceMin = Math.min(...values);
    const priceMax = Math.max(...values);
    const extras = [ma50, ma200].filter((value): value is number => typeof value === "number" && Number.isFinite(value));
    for (const point of points) {
      const day = point.time.slice(0, 10);
      const sma50 = ma50Days.get(day);
      const sma200 = ma200Days.get(day);
      const ema12 = ema12Days.get(day);
      const ema26 = ema26Days.get(day);
      if (sma50 != null) extras.push(sma50);
      if (sma200 != null) extras.push(sma200);
      if (ema12 != null) extras.push(ema12);
      if (ema26 != null) extras.push(ema26);
    }
    const mid = (priceMin + priceMax) / 2 || priceMax || 1;
    const band = Math.max((priceMax - priceMin) * 3, Math.abs(mid) * 0.04);
    const nearExtras = extras.filter((value) => value >= priceMin - band && value <= priceMax + band);
    const min = Math.min(priceMin, ...nearExtras);
    const max = Math.max(priceMax, ...nearExtras);
    const span = max - min || 1;
    const yOf = (value: number) => pad + ((max - value) / span) * (chartHeight - pad * 2);
    const rsiYOf = (value: number) => rsiTop + pad + ((100 - value) / 100) * (rsiHeight - pad * 2);
    const macdValues = [...macdDays.values(), ...macdSignalDays.values(), ...macdHistDays.values()];
    const macdMin = macdValues.length ? Math.min(0, ...macdValues) : 0;
    const macdMax = macdValues.length ? Math.max(0, ...macdValues) : 1;
    const macdSpan = macdMax - macdMin || 1;
    const macdYOf = (value: number) => macdTop + pad + ((macdMax - value) / macdSpan) * (macdHeight - pad * 2);
    const coords = points.map((point, index) => {
      const x = pad + (index / Math.max(points.length - 1, 1)) * (width - pad * 2);
      return { x, y: yOf(point.value) };
    });
    const path = coords.map((c, i) => `${i === 0 ? "M" : "L"}${c.x.toFixed(2)},${c.y.toFixed(2)}`).join(" ");
    const area = `${path} L${coords.at(-1)!.x.toFixed(2)},${chartHeight - pad} L${coords[0].x.toFixed(2)},${chartHeight - pad} Z`;
    const positive = points[points.length - 1].value >= points[0].value;
    const maxVolume = Math.max(...points.map((point) => point.volume ?? 0), 1);
    const barWidth = Math.max(1, ((width - pad * 2) / Math.max(points.length, 1)) * 0.72);
    const volumes = points.map((point, index) => {
      const x = pad + (index / Math.max(points.length - 1, 1)) * (width - pad * 2) - barWidth / 2;
      const barHeight = ((point.volume ?? 0) / maxVolume) * volHeight;
      return { x, barWidth, barHeight, y: volTop + volHeight - barHeight };
    });
    const macdZeroY = macdYOf(0);
    const macdBars = showMacd
      ? points.map((point, index) => {
          const hist = macdHistDays.get(point.time.slice(0, 10));
          const x = pad + (index / Math.max(points.length - 1, 1)) * (width - pad * 2) - barWidth / 2;
          if (hist == null) return { x, y: macdZeroY, barWidth, barHeight: 0, up: true };
          const y = macdYOf(hist);
          return {
            x,
            y: Math.min(y, macdZeroY),
            barWidth,
            barHeight: Math.abs(y - macdZeroY),
            up: hist >= 0,
          };
        })
      : [];
    const ma50Path = alignedPath(points, ma50Days, yOf, pad, width);
    const ma200Path = alignedPath(points, ma200Days, yOf, pad, width);
    return {
      path,
      area,
      min,
      max,
      width,
      height,
      positive,
      volumes,
      macdBars,
      ma50Y: !ma50Path && typeof ma50 === "number" && Number.isFinite(ma50) ? yOf(ma50) : null,
      ma200Y: !ma200Path && typeof ma200 === "number" && Number.isFinite(ma200) ? yOf(ma200) : null,
      ma50Path,
      ma200Path,
      ema12Path: alignedPath(points, ema12Days, yOf, pad, width),
      ema26Path: alignedPath(points, ema26Days, yOf, pad, width),
      rsiPath: showRsi ? alignedPath(points, rsiDays, rsiYOf, pad, width) : "",
      rsi30Y: rsiYOf(30),
      rsi50Y: rsiYOf(50),
      rsi70Y: rsiYOf(70),
      macdPath: showMacd ? alignedPath(points, macdDays, macdYOf, pad, width) : "",
      macdSignalPath: showMacd ? alignedPath(points, macdSignalDays, macdYOf, pad, width) : "",
      macdZeroY,
      ma50Days,
      ma200Days,
      ema12Days,
      ema26Days,
      rsiDays,
      macdDays,
      macdSignalDays,
    };
  }, [
    points,
    ma50,
    ma200,
    ma50Series,
    ma200Series,
    ema12Series,
    ema26Series,
    rsiSeries,
    macdSeries,
    macdSignalSeries,
    macdHistogramSeries,
    showRsi,
    showMacd,
  ]);

  const {
    path,
    area,
    min,
    max,
    width,
    height,
    positive,
    volumes,
    macdBars,
    ma50Y,
    ma200Y,
    ma50Path,
    ma200Path,
    ema12Path,
    ema26Path,
    rsiPath,
    rsi30Y,
    rsi50Y,
    rsi70Y,
    macdPath,
    macdSignalPath,
    macdZeroY,
    ma50Days,
    ma200Days,
    ema12Days,
    ema26Days,
    rsiDays,
    macdDays,
    macdSignalDays,
  } = layout;

  const active = hover != null ? points[hover] : points.at(-1);
  const start = points[0]?.value;
  const changePct = active && start ? ((active.value - start) / start) * 100 : null;
  const hasVolume = points.some((point) => (point.volume ?? 0) > 0);
  const activeDay = active?.time.slice(0, 10);
  const ma50Now = (activeDay ? ma50Days.get(activeDay) : undefined) ?? ma50;
  const ma200Now = (activeDay ? ma200Days.get(activeDay) : undefined) ?? ma200;
  const ema12Now = activeDay ? ema12Days.get(activeDay) : undefined;
  const ema26Now = activeDay ? ema26Days.get(activeDay) : undefined;
  const rsiNow = activeDay ? rsiDays.get(activeDay) : undefined;
  const macdNow = activeDay ? macdDays.get(activeDay) : undefined;
  const macdSignalNow = activeDay ? macdSignalDays.get(activeDay) : undefined;
  const svgHeightClass = showMacd ? "h-[430px] w-full" : showRsi ? "h-[360px] w-full" : "h-[280px] w-full";

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
          {typeof ema12Now === "number" ? (
            <span className="text-xs font-medium text-teal-700">EMA12 {formatPrice(ema12Now)}</span>
          ) : null}
          {typeof ema26Now === "number" ? (
            <span className="text-xs font-medium text-rose-600">EMA26 {formatPrice(ema26Now)}</span>
          ) : null}
          {typeof rsiNow === "number" ? (
            <span className="text-xs font-medium text-violet-700">RSI {formatNumber(rsiNow)}</span>
          ) : null}
          {typeof macdNow === "number" ? (
            <span className="text-xs font-medium text-sky-700">MACD {formatNumber(macdNow, 2)}</span>
          ) : null}
          {typeof macdSignalNow === "number" ? (
            <span className="text-xs font-medium text-orange-600">Signal {formatNumber(macdSignalNow, 2)}</span>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {showAdjustedToggle ? (
            <div className="inline-flex rounded-md border border-border p-0.5 text-xs" role="group" aria-label="Price adjustment">
              <Link
                href={`${pathname}${chartSearch(query, range, { adj: undefined })}`}
                scroll={false}
                className={cn(
                  "rounded px-2 py-1 font-semibold",
                  !adjusted ? "bg-header text-on-header" : "text-muted hover:bg-muted-bg",
                )}
              >
                Close
              </Link>
              <Link
                href={`${pathname}${chartSearch(query, range, { adj: "1" })}`}
                scroll={false}
                className={cn(
                  "rounded px-2 py-1 font-semibold",
                  adjusted ? "bg-header text-on-header" : "text-muted hover:bg-muted-bg",
                )}
              >
                Adj. Close
              </Link>
            </div>
          ) : null}
          {CHART_RANGES.map((item) => (
            <Link
              key={item}
              href={`${pathname}${chartSearch(query, item)}`}
              scroll={false}
              className={cn(
                "rounded px-2 py-1 text-xs font-semibold",
                item === range ? "bg-header text-on-header" : "text-muted hover:bg-muted-bg",
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
          className={svgHeightClass}
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
          <path d={path} fill="none" stroke={positive ? "#16a34a" : "#dc2626"} strokeWidth={points.length > 180 ? 1.25 : 2} />
          {ma50Path ? <path d={ma50Path} fill="none" stroke="#d97706" strokeWidth="1.5" /> : null}
          {ma200Path ? <path d={ma200Path} fill="none" stroke="#4f46e5" strokeWidth="1.5" /> : null}
          {ema12Path ? <path d={ema12Path} fill="none" stroke="#0d9488" strokeWidth="1.25" /> : null}
          {ema26Path ? <path d={ema26Path} fill="none" stroke="#e11d48" strokeWidth="1.25" /> : null}
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
          {showRsi ? (
            <>
              <line x1="8" x2={width - 8} y1={rsi70Y} y2={rsi70Y} stroke="#e9d5ff" strokeWidth="1" />
              <line x1="8" x2={width - 8} y1={rsi50Y} y2={rsi50Y} stroke="#ede9fe" strokeDasharray="3 3" strokeWidth="1" />
              <line x1="8" x2={width - 8} y1={rsi30Y} y2={rsi30Y} stroke="#e9d5ff" strokeWidth="1" />
              {rsiPath ? <path d={rsiPath} fill="none" stroke="#7c3aed" strokeWidth="1.5" /> : null}
              <text x="10" y={rsi70Y - 3} fill="#6d28d9" fontSize="9">
                RSI 70
              </text>
              <text x="10" y={rsi30Y + 10} fill="#6d28d9" fontSize="9">
                30
              </text>
            </>
          ) : null}
          {showMacd ? (
            <>
              <line x1="8" x2={width - 8} y1={macdZeroY} y2={macdZeroY} stroke="#e2e8f0" strokeWidth="1" />
              {macdBars.map((bar, index) =>
                bar.barHeight > 0 ? (
                  <rect
                    key={`macd-${index}`}
                    x={bar.x}
                    y={bar.y}
                    width={bar.barWidth}
                    height={bar.barHeight}
                    fill={bar.up ? "#86efac" : "#fca5a5"}
                    opacity={hover == null || hover === index ? 0.9 : 0.35}
                  />
                ) : null,
              )}
              {macdPath ? <path d={macdPath} fill="none" stroke="#0369a1" strokeWidth="1.5" /> : null}
              {macdSignalPath ? <path d={macdSignalPath} fill="none" stroke="#ea580c" strokeWidth="1.25" /> : null}
              <text x="10" y={macdZeroY - 3} fill="#0369a1" fontSize="9">
                MACD
              </text>
            </>
          ) : null}
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
