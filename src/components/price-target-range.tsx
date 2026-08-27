export function PriceTargetRange({
  price,
  low,
  median,
  consensus,
  high,
  format,
}: {
  price?: number | null;
  low?: number | null;
  median?: number | null;
  consensus?: number | null;
  high?: number | null;
  format: (value: number | null | undefined) => string;
}) {
  const marks = [
    { key: "low", label: "Low", value: low, className: "bg-muted" },
    { key: "price", label: "Last", value: price, className: "bg-header" },
    { key: "median", label: "Median", value: median, className: "bg-gain" },
    { key: "consensus", label: "Avg", value: consensus, className: "bg-brand" },
    { key: "high", label: "High", value: high, className: "bg-muted" },
  ].filter((mark): mark is { key: string; label: string; value: number; className: string } => {
    return typeof mark.value === "number" && Number.isFinite(mark.value);
  });
  if (marks.length < 2) return null;
  const min = Math.min(...marks.map((mark) => mark.value));
  const max = Math.max(...marks.map((mark) => mark.value));
  const span = max - min || 1;

  return (
    <div className="rounded-lg border border-border p-4">
      <div className="text-sm font-medium text-header">Price Target Range</div>
      <div className="relative mt-8 mb-10 h-2 rounded-full bg-chip">
        {marks.map((mark) => (
          <div
            key={mark.key}
            className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${((mark.value - min) / span) * 100}%` }}
          >
            <div className={`mx-auto h-3 w-3 rounded-full ${mark.className}`} title={`${mark.label} ${format(mark.value)}`} />
            <div className="absolute top-4 left-1/2 w-20 -translate-x-1/2 text-center text-[11px] leading-tight text-muted">
              <div className="font-medium text-header">{mark.label}</div>
              <div className="tabular">{format(mark.value)}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
