import { Container } from "@/components/container";
import { MetricCards } from "@/components/metric-cards";
import { PageHeader } from "@/components/page-header";
import { SectionNav } from "@/components/section-nav";
import { formatDate, formatInteger, formatSessionClock } from "@/lib/format";
import { getAllExchangeHours, getAvailableExchanges, getExchangeHolidays } from "@/lib/fmp";
import { holidaySchedule, sortExchangeHours } from "@/lib/markets";
import { MARKET_NAV } from "@/lib/nav";
import { cn } from "@/lib/utils";

export const metadata = {
  title: "Stock Market Hours",
  description: "Opening hours, time zones, and holidays for global stock exchanges from Financial Modeling Prep.",
};

export default async function MarketHoursPage() {
  const [hours, exchanges, nasdaqHolidays, nyseHolidays] = await Promise.all([
    getAllExchangeHours(),
    getAvailableExchanges(),
    getExchangeHolidays("NASDAQ"),
    getExchangeHolidays("NYSE"),
  ]);
  const byExchange = new Map(exchanges.map((row) => [row.exchange.toUpperCase(), row]));
  const rows = sortExchangeHours(hours);
  const openCount = rows.filter((row) => row.isMarketOpen).length;
  const { upcoming, recent } = holidaySchedule(
    [...nasdaqHolidays, ...nyseHolidays].filter((row, index, list) => {
      const key = `${row.exchange}|${row.date}|${row.name}`;
      return list.findIndex((item) => `${item.exchange}|${item.date}|${item.name}` === key) === index;
    }),
  );
  const holidays = (upcoming.length ? upcoming : recent).slice(0, 16);
  const holidayHeading = upcoming.length ? "Upcoming U.S. Holidays" : "Recent U.S. Holidays";

  return (
    <Container>
      <PageHeader
        title="Stock Market Hours"
        description="Live open/closed status and local session times for global exchanges, plus upcoming U.S. market holidays."
      />
      <SectionNav items={MARKET_NAV} />
      <MetricCards
        items={[
          { label: "Exchanges", value: formatInteger(rows.length) },
          { label: "Open now", value: formatInteger(openCount) },
          { label: "Closed", value: formatInteger(rows.length - openCount) },
        ]}
      />
      <section className="mt-10">
        <h2 className="mb-3 text-lg font-semibold text-header">Exchange Sessions</h2>
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="sa-table">
            <thead>
              <tr>
                <th>Exchange</th>
                <th>Country</th>
                <th>Opens</th>
                <th>Closes</th>
                <th>Time zone</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-muted">
                    Exchange hours are unavailable.
                  </td>
                </tr>
              ) : (
                rows.map((row) => {
                  const info = byExchange.get(row.exchange.toUpperCase());
                  return (
                    <tr key={row.exchange}>
                      <td>
                        <div className="font-medium">{row.name || row.exchange}</div>
                        <div className="text-xs text-muted">{row.exchange}</div>
                      </td>
                      <td className="text-muted">{info?.countryName || "—"}</td>
                      <td className="whitespace-nowrap">{formatSessionClock(row.openingHour)}</td>
                      <td className="whitespace-nowrap">{formatSessionClock(row.closingHour)}</td>
                      <td className="text-muted">{row.timezone || info?.countryCode || "—"}</td>
                      <td>
                        <span className={cn("font-semibold", row.isMarketOpen ? "text-gain" : "text-header")}>
                          {row.isMarketOpen ? "Open" : "Closed"}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>
      <section className="mt-10">
        <h2 className="mb-3 text-lg font-semibold text-header">{holidayHeading}</h2>
        {upcoming.length === 0 ? (
          <p className="mb-3 text-sm text-muted">
            FMP&apos;s holiday calendar does not yet include dates after today. Showing the latest NASDAQ and NYSE
            holidays on file.
          </p>
        ) : null}
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="sa-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Holiday</th>
                <th>Exchange</th>
                <th>Session</th>
              </tr>
            </thead>
            <tbody>
              {holidays.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-muted">
                    No NASDAQ or NYSE holidays in the FMP calendar.
                  </td>
                </tr>
              ) : (
                holidays.map((row) => (
                  <tr key={`${row.exchange}-${row.date}-${row.name}`}>
                    <td>{formatDate(row.date)}</td>
                    <td className="font-medium">{row.name}</td>
                    <td>{row.exchange}</td>
                    <td className="text-muted">{row.isClosed ? "Closed" : "Early close"}</td>
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
