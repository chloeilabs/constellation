import { TablePager } from "@/components/table-pager";
import { formatDate } from "@/lib/format";
import { pagerLinks } from "@/lib/paging";
import type { FmpDividend } from "@/lib/types";

export function DividendHistoryTable({
  rows,
  from,
  to,
  total,
  page,
  pageCount,
  path,
  formatAmount,
}: {
  rows: FmpDividend[];
  from: number;
  to: number;
  total: number;
  page: number;
  pageCount: number;
  path: string;
  formatAmount: (value: number | null | undefined) => string;
}) {
  const links = pagerLinks(path, page, pageCount);
  return (
    <>
      <div className="mt-8 overflow-x-auto rounded-lg border border-border">
        <table className="sa-table">
          <thead>
            <tr>
              <th>Ex-Dividend</th>
              <th>Record</th>
              <th>Payment</th>
              <th className="num">Amount</th>
              <th className="num">Yield</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-muted">
                  No dividend history found.
                </td>
              </tr>
            ) : (
              rows.map((row, index) => (
                <tr key={`${row.date}-${row.paymentDate}-${row.dividend}-${index}`}>
                  <td>{formatDate(row.date)}</td>
                  <td>{formatDate(row.recordDate)}</td>
                  <td>{formatDate(row.paymentDate)}</td>
                  <td className="num">{formatAmount(row.dividend)}</td>
                  <td className="num">{row.yield != null ? `${Number(row.yield).toFixed(2)}%` : "—"}</td>
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
    </>
  );
}
