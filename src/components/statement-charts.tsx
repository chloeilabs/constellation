import { HistoryBars } from "@/components/history-bars";

export function StatementCharts({
  series,
  formatValue,
}: {
  series: {
    title: string;
    items: { label: string; value: number }[];
    formatValue?: (value: number) => string;
  }[];
  formatValue?: (value: number) => string;
}) {
  const visible = series.filter((item) => item.items.length > 1);
  if (visible.length === 0) return null;
  return (
    <div className="mb-8 grid gap-4 md:grid-cols-2">
      {visible.map((item) => (
        <div key={item.title}>
          <h2 className="mb-2 text-sm font-semibold text-header">{item.title}</h2>
          <HistoryBars items={item.items} formatValue={item.formatValue ?? formatValue} />
        </div>
      ))}
    </div>
  );
}
