import Link from "next/link";
import { Container } from "@/components/container";
import { PageHeader } from "@/components/page-header";
import { formatCompactUsd, formatDate } from "@/lib/format";
import { getIpos } from "@/lib/fmp";
import { addDays, isoDate, nyDateString } from "@/lib/utils";

export default async function IpoCalendarPage() {
  const today = new Date(`${nyDateString()}T00:00:00Z`);
  const rows = await getIpos(isoDate(addDays(today, -45)), isoDate(addDays(today, 45)));

  return (
    <Container>
      <PageHeader
        title="IPO Calendar"
        description="Recent and upcoming initial public offerings."
        actions={
          <Link href="/calendar/earnings" className="text-sm text-link hover:underline">
            Earnings calendar
          </Link>
        }
      />
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="sa-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Symbol</th>
              <th>Company</th>
              <th>Exchange</th>
              <th>Status</th>
              <th className="num">Market Cap</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-muted">
                  No IPOs in this window.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={`${row.symbol}-${row.date}`}>
                  <td>{formatDate(row.date)}</td>
                  <td className="symbol">
                    {row.symbol ? (
                      <Link href={`/stocks/${row.symbol}`} className="text-link hover:underline">
                        {row.symbol}
                      </Link>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td>{row.company}</td>
                  <td>{row.exchange}</td>
                  <td>{row.actions}</td>
                  <td className="num">{formatCompactUsd(row.marketCap)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </Container>
  );
}
