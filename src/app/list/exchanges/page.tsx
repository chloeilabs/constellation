import Link from "next/link";
import { Container } from "@/components/container";
import { PageHeader } from "@/components/page-header";
import { SectionNav } from "@/components/section-nav";
import { MetricCards } from "@/components/metric-cards";
import { exchangeStocksHref } from "@/lib/countries";
import { formatInteger } from "@/lib/format";
import { getAllExchangeHours, getAvailableExchanges } from "@/lib/fmp";
import { STOCKS_NAV } from "@/lib/nav";
import { cn } from "@/lib/utils";

export const metadata = {
  title: "Stock Exchanges",
  description: "Active exchanges from Financial Modeling Prep, with country, ticker suffix, quote delay, and live open/closed status.",
};

export default async function ExchangesListPage() {
  const [exchanges, hours] = await Promise.all([getAvailableExchanges(), getAllExchangeHours()]);
  const hoursByCode = new Map(hours.map((row) => [row.exchange.toUpperCase(), row]));
  const rows = [...exchanges].sort((a, b) => (a.name || a.exchange).localeCompare(b.name || b.exchange));
  const openCount = rows.filter((row) => hoursByCode.get(row.exchange.toUpperCase())?.isMarketOpen).length;

  return (
    <Container>
      <PageHeader
        title="Stock Exchanges"
        description="Live FMP coverage of global exchanges. Open/closed status follows each venue's local session, not U.S. hours."
      />
      <SectionNav items={STOCKS_NAV} />
      <MetricCards
        items={[
          { label: "Exchanges", value: formatInteger(rows.length) },
          { label: "Open now", value: formatInteger(openCount) },
          { label: "Closed", value: formatInteger(rows.length - openCount) },
        ]}
      />
      <div className="mt-8 overflow-x-auto rounded-lg border border-border">
        <table className="sa-table">
          <thead>
            <tr>
              <th>Exchange</th>
              <th>Code</th>
              <th>Country</th>
              <th>Suffix</th>
              <th>Delay</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-muted">
                  Exchange directory is unavailable.
                </td>
              </tr>
            ) : (
              rows.map((row) => {
                const session = hoursByCode.get(row.exchange.toUpperCase());
                const href = exchangeStocksHref(row.exchange);
                const suffix = row.symbolSuffix && row.symbolSuffix !== "N/A" ? row.symbolSuffix : "—";
                return (
                  <tr key={row.exchange}>
                    <td>
                      {href ? (
                        <Link href={href} className="font-medium text-link hover:underline">
                          {row.name || row.exchange}
                        </Link>
                      ) : (
                        <span className="font-medium">{row.name || row.exchange}</span>
                      )}
                    </td>
                    <td className="tabular">{row.exchange}</td>
                    <td className="text-muted">{row.countryName || "—"}</td>
                    <td className="tabular text-muted">{suffix}</td>
                    <td className="text-muted">{row.delay || "—"}</td>
                    <td>
                      {session ? (
                        <span className={cn("font-semibold", session.isMarketOpen ? "text-gain" : "text-header")}>
                          {session.isMarketOpen ? "Open" : "Closed"}
                        </span>
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </Container>
  );
}
