export function sparseAxisLabel(items: { label: string }[], index: number) {
  const count = items.length;
  if (count <= 18) return items[index].label;
  const step = Math.max(1, Math.round((count - 1) / 10));
  if (index === 0 || index === count - 1 || index % step === 0) return items[index].label;
  return "";
}

export function HistoryBars({
  items,
  formatValue,
}: {
  items: { label: string; value: number }[];
  formatValue?: (value: number) => string;
}) {
  if (items.length === 0) return null;
  const max = Math.max(...items.map((item) => item.value), 0);
  const min = Math.min(...items.map((item) => item.value), 0);
  const hasNegative = min < 0;

  if (!hasNegative) {
    const peak = Math.max(max, 1);
    return (
      <div
        className={`flex h-48 items-end gap-2 rounded-lg border border-border bg-muted-bg px-3 pb-8 pt-4 ${items.length <= 8 ? "justify-center" : ""}`}
      >
        {items.map((item, index) => (
          <div
            key={`${item.label}-${index}`}
            className={`flex h-full flex-col justify-end ${items.length <= 8 ? "w-11 shrink-0 sm:w-14" : "min-w-0 flex-1"}`}
          >
            <div
              className="w-full rounded-t bg-brand/80"
              style={{ height: `${Math.max(4, (item.value / peak) * 100)}%` }}
              title={formatValue ? `${item.label}: ${formatValue(item.value)}` : item.label}
            />
            <div className="mt-1 truncate text-center text-[10px] text-muted">{sparseAxisLabel(items, index)}</div>
          </div>
        ))}
      </div>
    );
  }

  const span = Math.max(max - min, 1e-9);
  const upRatio = max / span;
  const downRatio = -min / span;

  return (
    <div className="rounded-lg border border-border bg-muted-bg px-3 pb-8 pt-4">
      <div className={`flex h-48 items-stretch gap-2 ${items.length <= 8 ? "justify-center" : ""}`}>
        {items.map((item, index) => {
          const positive = item.value >= 0;
          const title = formatValue ? `${item.label}: ${formatValue(item.value)}` : item.label;
          return (
            <div
              key={`${item.label}-${index}`}
              className={`flex flex-col ${items.length <= 8 ? "w-11 shrink-0 sm:w-14" : "min-w-0 flex-1"}`}
            >
              <div className="flex justify-end" style={{ flexGrow: Math.max(upRatio, 0.08), flexBasis: 0 }}>
                {positive ? (
                  <div
                    className="w-full self-end rounded-t bg-gain/80"
                    style={{ height: `${Math.max(6, (item.value / (max || 1)) * 100)}%` }}
                    title={title}
                  />
                ) : null}
              </div>
              <div className="h-px bg-border-strong" />
              <div className="flex justify-start" style={{ flexGrow: Math.max(downRatio, 0.08), flexBasis: 0 }}>
                {!positive ? (
                  <div
                    className="w-full self-start rounded-b bg-loss/80"
                    style={{ height: `${Math.max(6, (-item.value / (-min || 1)) * 100)}%` }}
                    title={title}
                  />
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
      <div className={`mt-1 flex gap-2 ${items.length <= 8 ? "justify-center" : ""}`}>
        {items.map((item, index) => (
          <div
            key={`${item.label}-${index}`}
            className={`truncate text-center text-[10px] text-muted ${items.length <= 8 ? "w-11 shrink-0 sm:w-14" : "min-w-0 flex-1"}`}
          >
            {sparseAxisLabel(items, index)}
          </div>
        ))}
      </div>
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
    <div className="flex flex-col gap-3">
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
