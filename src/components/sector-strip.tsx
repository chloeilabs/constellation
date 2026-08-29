import Link from "next/link";
import { ChangePercent } from "@/components/change";
import { industrySlug } from "@/lib/industries";
import type { FmpSectorPerformance } from "@/lib/types";

function uniqueSectors(rows: FmpSectorPerformance[]) {
  const bySector = new Map<string, FmpSectorPerformance>();
  for (const row of rows) {
    const existing = bySector.get(row.sector);
    if (!existing || /NASDAQ|NYSE|^US$/i.test(row.exchange)) {
      bySector.set(row.sector, row);
    }
  }
  return [...bySector.values()].sort((a, b) => b.averageChange - a.averageChange);
}

export function SectorStrip({ rows }: { rows: FmpSectorPerformance[] }) {
  const sectors = uniqueSectors(rows);
  if (sectors.length === 0) return null;

  return (
    <section>
      <div className="mb-3 flex items-end justify-between">
        <h2 className="text-xl font-semibold text-header">Sector Performance</h2>
        <Link href="/markets/sectors" className="text-sm text-link hover:underline">
          All sectors
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
        {sectors.map((row) => (
          <Link
            key={row.sector}
            href={`/stocks/industry#${industrySlug(row.sector)}`}
            className="flex items-center justify-between gap-2 rounded-lg border border-border px-3 py-2 transition-colors hover:border-border-strong hover:bg-muted-bg"
          >
            <span className="truncate text-sm font-medium text-header">{row.sector}</span>
            <ChangePercent value={row.averageChange} className="shrink-0 text-sm" />
          </Link>
        ))}
      </div>
    </section>
  );
}
