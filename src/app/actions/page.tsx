import Link from "next/link";
import { Container } from "@/components/container";
import { PageHeader } from "@/components/page-header";
import { SectionNav } from "@/components/section-nav";
import { CALENDAR_NAV } from "@/lib/nav";
import { formatDate } from "@/lib/format";
import { getDelistedCompanies, getLatestMergers, getSplitsCalendar, getSymbolChanges } from "@/lib/fmp";
import { isForeignListingSymbol, isUsVenue } from "@/lib/listings";
import { addDays, isoDate, nyDateString } from "@/lib/utils";

export default async function ActionsPage() {
  const today = nyDateString();
  const from = isoDate(addDays(new Date(`${today}T00:00:00Z`), -21));
  const to = isoDate(addDays(new Date(`${today}T00:00:00Z`), 21));
  const [mergersRaw, splits, symbolChangesRaw, delistedRaw] = await Promise.all([
    getLatestMergers(60),
    getSplitsCalendar(from, to),
    getSymbolChanges(),
    getDelistedCompanies(0, 100),
  ]);
  const seen = new Set<string>();
  const mergers = mergersRaw.filter((row) => {
    const key = `${row.symbol}|${row.targetedSymbol}|${row.transactionDate}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  const usSplits = splits.filter((row) => !isForeignListingSymbol(row.symbol)).slice(0, 80);
  const symbolChanges = symbolChangesRaw
    .filter((row) => !isForeignListingSymbol(row.oldSymbol) && !isForeignListingSymbol(row.newSymbol))
    .slice(0, 40);
  const delisted = delistedRaw
    .filter((row) => isUsVenue(row.exchange) && !isForeignListingSymbol(row.symbol))
    .slice(0, 40);

  return (
    <Container>
      <PageHeader
        title="Corporate Actions"
        description="Mergers, splits, ticker changes, and recent U.S. delistings."
      />
      <SectionNav items={CALENDAR_NAV} />

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

      <section className="mt-10">
        <h2 className="mb-3 text-lg font-semibold text-header">Symbol Changes</h2>
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="sa-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Company</th>
                <th>Old</th>
                <th>New</th>
              </tr>
            </thead>
            <tbody>
              {symbolChanges.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-muted">
                    No recent ticker changes.
                  </td>
                </tr>
              ) : (
                symbolChanges.map((row) => (
                  <tr key={`${row.date}-${row.oldSymbol}-${row.newSymbol}`}>
                    <td>{formatDate(row.date)}</td>
                    <td className="max-w-[280px] truncate">{row.companyName}</td>
                    <td className="symbol">{row.oldSymbol}</td>
                    <td className="symbol">
                      <Link href={`/stocks/${row.newSymbol}`} className="text-link hover:underline">
                        {row.newSymbol}
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-10">
        <h2 className="mb-3 text-lg font-semibold text-header">Delisted Companies</h2>
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="sa-table">
            <thead>
              <tr>
                <th>Delisted</th>
                <th>Symbol</th>
                <th>Company</th>
                <th>Exchange</th>
                <th>IPO Date</th>
              </tr>
            </thead>
            <tbody>
              {delisted.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-muted">
                    No recent U.S. delistings.
                  </td>
                </tr>
              ) : (
                delisted.map((row) => (
                  <tr key={`${row.symbol}-${row.delistedDate}`}>
                    <td>{formatDate(row.delistedDate)}</td>
                    <td className="symbol">{row.symbol}</td>
                    <td className="max-w-[280px] truncate">{row.companyName}</td>
                    <td>{row.exchange}</td>
                    <td>{formatDate(row.ipoDate)}</td>
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
