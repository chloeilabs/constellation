export function HistoryBars({
  items,
  formatValue,
}: {
  items: { label: string; value: number }[];
  formatValue?: (value: number) => string;
}) {
  if (items.length === 0) return null;
  const max = Math.max(...items.map((item) => item.value), 1);
  return (
    <div className="flex h-48 items-end gap-1 rounded-lg border border-border bg-muted-bg px-3 pb-8 pt-4">
      {items.map((item) => (
        <div key={item.label} className="flex h-full min-w-0 flex-1 flex-col justify-end">
          <div
            className="w-full rounded-t bg-brand/80"
            style={{ height: `${Math.max(4, (item.value / max) * 100)}%` }}
            title={formatValue ? `${item.label}: ${formatValue(item.value)}` : item.label}
          />
          <div className="mt-1 truncate text-center text-[10px] text-muted">{item.label}</div>
        </div>
      ))}
    </div>
  );
}

export function SegmentBars({
  items,
}: {
  items: { label: string; value: number }[];
}) {
  const total = items.reduce((sum, item) => sum + Math.max(item.value, 0), 0);
  const max = Math.max(...items.map((item) => item.value), 1);
  if (items.length === 0) return null;
  return (
    <div className="space-y-3">
      {items.map((item) => {
        const share = total > 0 ? item.value / total : 0;
        return (
          <div key={item.label}>
            <div className="mb-1 flex items-baseline justify-between gap-3 text-sm">
              <span className="font-medium text-header">{item.label}</span>
              <span className="tabular text-muted">
                {(share * 100).toFixed(1)}%
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-chip">
              <div className="h-full rounded-full bg-brand" style={{ width: `${(item.value / max) * 100}%` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
