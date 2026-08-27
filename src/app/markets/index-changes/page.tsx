import Link from "next/link";
import { Container } from "@/components/container";
import { PageHeader } from "@/components/page-header";
import { SectionNav } from "@/components/section-nav";
import { INDEX_CHANGES_NAV, MARKET_NAV } from "@/lib/nav";
import { formatDate } from "@/lib/format";
import { getHistoricalConstituents } from "@/lib/fmp";
import { cn } from "@/lib/utils";

const INDEX_META = {
  sp500: {
    title: "S&P 500 Index Changes",
    description: "Additions and removals from the S&P 500, with the stated reason when FMP provides one.",
  },
  nasdaq: {
    title: "Nasdaq 100 Index Changes",
    description: "Historical additions and removals from the Nasdaq-100.",
  },
  dow: {
    title: "Dow Jones Index Changes",
    description: "Historical additions and removals from the Dow Jones Industrial Average.",
  },
};

function SymbolCell({ symbol, name }: { symbol?: string | null; name?: string | null }) {
  if (!symbol && !name) return <span className="text-muted">—</span>;
  return (
    <div>
      {symbol ? (
        <Link href={`/stocks/${symbol}`} className="font-semibold text-link hover:underline">
          {symbol}
        </Link>
      ) : null}
      {name ? <div className="max-w-[240px] truncate text-xs text-muted">{name}</div> : null}
    </div>
  );
}

export default async function IndexChangesPage({
  searchParams,
}: {
  searchParams: Promise<{ index?: string }>;
}) {
  const { index: indexParam } = await searchParams;
  const index = indexParam === "nasdaq" || indexParam === "dow" ? indexParam : "sp500";
  const meta = INDEX_META[index];
  const rows = (await getHistoricalConstituents(index)).slice(0, 80);
  const activeHref = index === "sp500" ? "/markets/index-changes" : `/markets/index-changes?index=${index}`;

  return (
    <Container>
      <PageHeader title={meta.title} description={meta.description} />
      <SectionNav items={MARKET_NAV} />
      <div className="mb-5 flex flex-wrap gap-2">
        {INDEX_CHANGES_NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "rounded-full px-3 py-1 text-sm font-medium",
              item.href === activeHref ? "bg-header text-white" : "bg-chip text-header hover:bg-border",
            )}
          >
            {item.label}
          </Link>
        ))}
      </div>
      <p className="mb-3 text-sm text-muted">{rows.length} most recent changes</p>
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="sa-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Added</th>
              <th>Removed</th>
              <th>Reason</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={4} className="text-muted">
                  No constituent changes available.
                </td>
              </tr>
            ) : (
              rows.map((row, indexRow) => (
                <tr key={`${row.date}-${row.symbol}-${row.removedTicker}-${indexRow}`}>
                  <td>{formatDate(row.date)}</td>
                  <td>
                    <SymbolCell symbol={row.symbol} name={row.addedSecurity} />
                  </td>
                  <td>
                    <SymbolCell symbol={row.removedTicker} name={row.removedSecurity} />
                  </td>
                  <td className="max-w-[360px] whitespace-normal text-sm text-muted">{row.reason || "—"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </Container>
  );
}
