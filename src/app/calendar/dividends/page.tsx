import Link from "next/link";
import { Container } from "@/components/container";
import { PageHeader } from "@/components/page-header";
import { SectionNav } from "@/components/section-nav";
import { CALENDAR_NAV } from "@/lib/nav";
import { formatDate, formatPrice } from "@/lib/format";
import { getDividendCalendar } from "@/lib/fmp";
import { addDays, isoDate, nyDateString } from "@/lib/utils";

export default async function DividendCalendarPage() {
  const today = nyDateString();
  const rows = await getDividendCalendar(today, isoDate(addDays(new Date(`${today}T00:00:00Z`), 14)));

  return (
    <Container>
      <PageHeader title="Dividend Calendar" description="Upcoming ex-dividend dates." />
      <SectionNav items={CALENDAR_NAV} />
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="sa-table">
          <thead>
            <tr>
              <th>Ex-Date</th>
              <th>Symbol</th>
              <th className="num">Dividend</th>
              <th>Payment</th>
              <th>Frequency</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-muted">
                  No upcoming dividends found.
                </td>
              </tr>
            ) : (
              rows.slice(0, 200).map((row, index) => (
                <tr key={`${row.symbol}-${row.date}-${index}`}>
                  <td>{formatDate(row.date)}</td>
                  <td className="symbol">
                    <Link href={`/stocks/${row.symbol}`} className="text-link hover:underline">
                      {row.symbol}
                    </Link>
                  </td>
                  <td className="num">${formatPrice(row.dividend)}</td>
                  <td>{formatDate(row.paymentDate)}</td>
                  <td>{row.frequency}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </Container>
  );
}
