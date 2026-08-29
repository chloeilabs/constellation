import Link from "next/link";
import { formatPercent } from "@/lib/format";
import { heatStyle } from "@/lib/heatmap";

export type HeatmapStock = {
  symbol: string;
  name: string;
  sector: string;
  marketCap: number;
  changePercentage: number | null;
};

export function MarketHeatmap({ rows }: { rows: HeatmapStock[] }) {
  const sectors = new Map<string, { cap: number; stocks: HeatmapStock[] }>();
  for (const row of rows) {
    const sector = row.sector || "Other";
    const current = sectors.get(sector) ?? { cap: 0, stocks: [] };
    current.cap += row.marketCap || 0;
    current.stocks.push(row);
    sectors.set(sector, current);
  }

  const groups = [...sectors.entries()]
    .map(([sector, value]) => ({
      sector,
      cap: value.cap,
      stocks: [...value.stocks].sort((a, b) => (b.marketCap || 0) - (a.marketCap || 0)),
    }))
    .sort((a, b) => b.cap - a.cap);

  if (groups.length === 0) {
    return <p className="text-sm text-muted">Heatmap data is unavailable for the latest session.</p>;
  }

  return (
    <div className="flex min-h-[640px] flex-wrap gap-1">
      {groups.map((group) => (
        <div
          key={group.sector}
          className="flex min-h-[140px] min-w-[160px] flex-[1_1_220px] flex-col gap-px overflow-hidden rounded-md"
          style={{ flexGrow: Math.max(group.cap / 1e11, 1.2) }}
        >
          <div className="bg-header px-2 py-1 text-[11px] font-semibold text-on-header">{group.sector}</div>
          <div className="flex min-h-0 flex-1 flex-wrap gap-px bg-border">
            {group.stocks.map((stock) => {
              const style = heatStyle(stock.changePercentage);
              return (
                <Link
                  key={stock.symbol}
                  href={`/stocks/${stock.symbol}`}
                  title={`${stock.symbol} ${stock.name} ${formatPercent(stock.changePercentage, { alreadyPercent: true })}`}
                  className="flex min-h-[52px] min-w-[72px] flex-col justify-between p-1.5 text-left"
                  style={{
                    ...style,
                    flexGrow: Math.max((stock.marketCap || 0) / 1e10, 0.8),
                  }}
                >
                  <span className="text-xs font-bold leading-tight">{stock.symbol}</span>
                  <span className="text-[11px] tabular font-medium">
                    {formatPercent(stock.changePercentage, { alreadyPercent: true })}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

export function IndustryTiles({
  rows,
}: {
  rows: { industry: string; averageChange: number; href?: string }[];
}) {
  if (rows.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1">
      {rows.map((row) => {
        const style = heatStyle(row.averageChange);
        const inner = (
          <>
            <div className="truncate text-xs font-medium">{row.industry}</div>
            <div className="mt-1 text-sm tabular font-semibold">
              {formatPercent(row.averageChange, { alreadyPercent: true })}
            </div>
          </>
        );
        const className = "min-w-[140px] flex-1 rounded-md px-3 py-2";
        if (row.href) {
          return (
            <Link key={row.industry} href={row.href} className={className} style={style} title={row.industry}>
              {inner}
            </Link>
          );
        }
        return (
          <div key={row.industry} className={className} style={style} title={row.industry}>
            {inner}
          </div>
        );
      })}
    </div>
  );
}
