import Link from "next/link";
import { Container } from "@/components/container";
import { PageHeader } from "@/components/page-header";
import { formatDate } from "@/lib/format";
import { getLatestMergers, getSplitsCalendar } from "@/lib/fmp";
import { isForeignListingSymbol } from "@/lib/listings";
import { addDays, isoDate, nyDateString } from "@/lib/utils";

export default async function ActionsPage() {
  const today = nyDateString();
  const from = isoDate(addDays(new Date(`${today}T00:00:00Z`), -21));
  const to = isoDate(addDays(new Date(`${today}T00:00:00Z`), 21));
  const [mergers, splits] = await Promise.all([getLatestMergers(60), getSplitsCalendar(from, to)]);
  const usSplits = splits.filter((row) => !isForeignListingSymbol(row.symbol)).slice(0, 80);

  return (
    <Container>
      <PageHeader
        title="Corporate Actions"
        description="Recent mergers and acquisitions plus upcoming and recent stock splits."
      />

      <section>
        <h2 className="mb-3 text-lg font-semibold text-header">Mergers & Acquisitions</h2>
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="sa-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Acquirer</th>
                <th>Target</th>
                <th>Filing</th>
              </tr>
            </thead>
            <tbody>
              {mergers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-muted">
                    No recent M&A filings.
                  </td>
                </tr>
              ) : (
                mergers.map((row, index) => (
                  <tr key={`${row.symbol}-${row.targetedSymbol}-${row.transactionDate}-${index}`}>
                    <td>{formatDate(row.transactionDate)}</td>
                    <td>
                      {row.symbol ? (
                        <Link href={`/stocks/${row.symbol}`} className="font-semibold text-link hover:underline">
                          {row.symbol}
                        </Link>
                      ) : (
                        "—"
                      )}
                      <div className="max-w-[240px] truncate text-xs text-muted">{row.companyName}</div>
                    </td>
                    <td>
                      {row.targetedSymbol ? (
                        <Link href={`/stocks/${row.targetedSymbol}`} className="font-semibold text-link hover:underline">
                          {row.targetedSymbol}
                        </Link>
                      ) : (
                        "—"
                      )}
                      <div className="max-w-[240px] truncate text-xs text-muted">{row.targetedCompanyName}</div>
                    </td>
                    <td>
                      {row.link ? (
                        <a href={row.link} className="text-link hover:underline" target="_blank" rel="noreferrer">
                          SEC
                        </a>
                      ) : (
                        "—"
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-10">
        <div className="mb-3 flex items-end justify-between">
          <h2 className="text-lg font-semibold text-header">Stock Splits</h2>
          <Link href="/calendar/splits" className="text-sm text-link hover:underline">
            Full split calendar
          </Link>
        </div>
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="sa-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Symbol</th>
                <th>Ratio</th>
                <th>Type</th>
              </tr>
            </thead>
            <tbody>
              {usSplits.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-muted">
                    No splits in this window.
                  </td>
                </tr>
              ) : (
                usSplits.map((row) => (
                  <tr key={`${row.symbol}-${row.date}-${row.numerator}-${row.denominator}`}>
                    <td>{formatDate(row.date)}</td>
                    <td className="symbol">
                      <Link href={`/stocks/${row.symbol}`} className="text-link hover:underline">
                        {row.symbol}
                      </Link>
                    </td>
                    <td>
                      {row.numerator}:{row.denominator}
                    </td>
                    <td className="capitalize">{row.splitType?.replace("-", " ") || "Stock split"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </Container>
  );
}
