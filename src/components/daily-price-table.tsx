import { ChangePercent } from "@/components/change";
import { DownloadCsvLink } from "@/components/download-csv-link";
import { TablePager } from "@/components/table-pager";
import { formatDate, formatInteger } from "@/lib/format";
import { pagerLinks } from "@/lib/paging";

type DailyRow = {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  adjClose: number | null;
  closeChangePercent: number | null;
  volume: number;
};

export function DailyPriceTable({
  rows,
  from,
  to,
  total,
  page,
  pageCount,
  path,
  extra,
  csvHref,
  rangeSlug,
  formatPrice: px,
  showAdjClose,
}: {
  rows: DailyRow[];
  from: number;
  to: number;
  total: number;
  page: number;
  pageCount: number;
  path: string;
  extra?: Record<string, string | undefined>;
  csvHref?: string;
  rangeSlug: string;
  formatPrice: (value: number | null | undefined) => string;
  showAdjClose: boolean;
}) {
  const links = pagerLinks(path, page, pageCount, extra);
  return (
    <section>
      <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
        <h2 className="text-lg font-semibold text-header">Daily Prices</h2>
        {csvHref && total ? <DownloadCsvLink href={csvHref} /> : null}
      </div>
      <p className="mb-2 text-xs text-muted">
        {showAdjClose
          ? "Adj. Close is FMP dividend-adjusted. Change is versus the previous session close."
          : "Change is versus the previous session close."}{" "}
        Download CSV for the full {rangeSlug} window.
      </p>
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="sa-table">
          <thead>
            <tr>
              <th>Date</th>
              <th className="num">Open</th>
              <th className="num">High</th>
              <th className="num">Low</th>
              <th className="num">Close</th>
              {showAdjClose ? <th className="num">Adj. Close</th> : null}
              <th className="num">Change</th>
              <th className="num">Volume</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={showAdjClose ? 8 : 7} className="text-muted">
                  No price history available.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.date}>
                  <td>{formatDate(row.date)}</td>
                  <td className="num">{px(row.open)}</td>
                  <td className="num">{px(row.high)}</td>
                  <td className="num">{px(row.low)}</td>
                  <td className="num">{px(row.close)}</td>
                  {showAdjClose ? <td className="num">{px(row.adjClose)}</td> : null}
                  <td className="num">
                    <ChangePercent value={row.closeChangePercent} />
                  </td>
                  <td className="num">{formatInteger(row.volume)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <TablePager
        from={from}
        to={to}
        total={total}
        page={page}
        pageCount={pageCount}
        {...links}
      />
    </section>
  );
}
