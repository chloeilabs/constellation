import { formatUsd } from "@/lib/format";
import { sparseAxisLabel } from "@/components/history-bars";

export type FundamentalChartItem = {
  label: string;
  metric: number | null;
  price: number | null;
};

function axisTicks(min: number, max: number, count = 4) {
  if (!Number.isFinite(min) || !Number.isFinite(max)) return [];
  if (max === min) return [min];
  const step = (max - min) / (count - 1);
  return Array.from({ length: count }, (_, index) => min + step * index);
}

export function FundamentalOverlayChart({
  items,
  formatMetric,
  formatPrice = formatUsd,
}: {
  items: FundamentalChartItem[];
  formatMetric: (value: number) => string;
  formatPrice?: (value: number) => string;
}) {
  const values = items.map((item) => item.metric).filter((value): value is number => value != null && Number.isFinite(value));
  const prices = items.map((item) => item.price).filter((value): value is number => value != null && Number.isFinite(value));
  if (values.length === 0) {
    return <p className="text-sm text-muted">Not enough history to draw this metric.</p>;
  }

  const width = 720;
  const height = 280;
  const padL = prices.length > 0 ? 56 : 8;
  const padR = prices.length > 0 ? 56 : 8;
  const padT = 16;
  const padB = 36;
  const plotW = width - padL - padR;
  const plotH = height - padT - padB;
  const mMin = Math.min(0, ...values);
  const mMax = Math.max(0, ...values);
  const mSpan = Math.max(mMax - mMin, 1e-9);
  const pMin = prices.length ? Math.min(...prices) : 0;
  const pMax = prices.length ? Math.max(...prices) : 1;
  const pPad = (pMax - pMin) * 0.08 || 1;
  const pLo = pMin - pPad;
  const pHi = pMax + pPad;
  const pSpan = Math.max(pHi - pLo, 1e-9);
  const n = Math.max(items.length, 1);
  const slot = plotW / n;
  const barW = Math.max(6, Math.min(28, slot * 0.55));
  const yMetric = (value: number) => padT + ((mMax - value) / mSpan) * plotH;
  const yPrice = (value: number) => padT + ((pHi - value) / pSpan) * plotH;
  const zeroY = yMetric(0);
  const coords = items
    .map((item, index) => {
      if (item.price == null) return null;
      return { x: padL + slot * index + slot / 2, y: yPrice(item.price) };
    })
    .filter((point): point is { x: number; y: number } => point != null);
  const pricePath = coords.map((point, index) => `${index === 0 ? "M" : "L"}${point.x.toFixed(2)},${point.y.toFixed(2)}`).join(" ");
  const metricTicks = axisTicks(mMin, mMax);
  const priceTicks = prices.length > 0 ? axisTicks(pLo, pHi) : [];

  return (
    <div>
      <svg viewBox={`0 0 ${width} ${height}`} className="h-[280px] w-full">
        <line x1={padL} x2={width - padR} y1={zeroY} y2={zeroY} stroke="#94a3b8" strokeWidth="1" />
        {metricTicks.map((tick) => (
          <text
            key={`m-${tick}`}
            x={padL - 6}
            y={yMetric(tick) + 3}
            textAnchor="end"
            className="fill-[#64748b]"
            fontSize="9"
          >
            {formatMetric(tick)}
          </text>
        ))}
        {priceTicks.map((tick) => (
          <text
            key={`p-${tick}`}
            x={width - padR + 6}
            y={yPrice(tick) + 3}
            textAnchor="start"
            className="fill-[#4f46e5]"
            fontSize="9"
          >
            {formatPrice(tick)}
          </text>
        ))}
        {items.map((item, index) => {
          if (item.metric == null) return null;
          const x = padL + slot * index + slot / 2 - barW / 2;
          const y = item.metric >= 0 ? yMetric(item.metric) : zeroY;
          const h = Math.max(2, Math.abs(yMetric(item.metric) - zeroY));
          return (
            <rect
              key={`${item.label}-${index}`}
              x={x}
              y={y}
              width={barW}
              height={h}
              rx="2"
              fill={item.metric >= 0 ? "#16a34a" : "#dc2626"}
              opacity="0.85"
            >
              <title>{`${item.label}: ${formatMetric(item.metric)}${item.price != null ? ` · Close ${formatPrice(item.price)}` : ""}`}</title>
            </rect>
          );
        })}
        {pricePath ? <path d={pricePath} fill="none" stroke="#4f46e5" strokeWidth="2" /> : null}
        {items.map((item, index) => {
          const label = sparseAxisLabel(items, index);
          if (!label) return null;
          return (
            <text
              key={`label-${item.label}-${index}`}
              x={padL + slot * index + slot / 2}
              y={height - 10}
              textAnchor="middle"
              className="fill-[#94a3b8]"
              fontSize="9"
            >
              {label}
            </text>
          );
        })}
      </svg>
      <div className="mt-2 flex flex-wrap gap-4 text-xs text-muted">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-brand/80" />
          Metric
        </span>
        {prices.length > 0 ? (
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-indigo-600" />
            Period-end close
          </span>
        ) : null}
      </div>
    </div>
  );
}
