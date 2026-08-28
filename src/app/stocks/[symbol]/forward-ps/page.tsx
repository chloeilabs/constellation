import Link from "next/link";
import { Container } from "@/components/container";
import { PageHeader } from "@/components/page-header";
import { SectionNav } from "@/components/section-nav";
import { quoteFundamentalsNav } from "@/lib/nav";
import { MetricCards } from "@/components/metric-cards";
import { compactMoneyFn, formatDate, formatRatio, reportingCurrency } from "@/lib/format";
import { getEstimates, getIncomeTtm, getProfile, getQuote } from "@/lib/fmp";
import { decodeTicker, stockPath } from "@/lib/listings";
import { forwardPs, nextEstimate } from "@/lib/valuation";

function num(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

export default async function ForwardPsPage({ params }: { params: Promise<{ symbol: string }> }) {
  const { symbol } = await params;
  const ticker = decodeTicker(symbol);
  const [quote, profile, estimates, ttm] = await Promise.all([
    getQuote(ticker),
    getProfile(ticker),
    getEstimates(ticker, "annual"),
    getIncomeTtm(ticker),
  ]);
  const marketCap = num(quote?.marketCap) ?? num(profile?.marketCap);
  const next = nextEstimate(estimates);
  const fwd = forwardPs(marketCap, estimates);
  const trailing =
    marketCap != null && ttm?.revenue && ttm.revenue > 0 ? marketCap / ttm.revenue : null;
  const money = compactMoneyFn(reportingCurrency(profile?.currency));
  const ranked = [...estimates].filter((row) => row.date).sort((a, b) => a.date.localeCompare(b.date));

  return (
    <Container>
      <PageHeader
        title={`${ticker} Forward PS`}
        description="Market cap divided by the next annual consensus revenue estimate from live FMP analyst estimates."
      />
      <SectionNav items={quoteFundamentalsNav(ticker)} />
      <MetricCards
        items={[
          { label: "Forward PS", value: formatRatio(fwd) },
          {
            label: "Trailing PS",
            href: stockPath(ticker, "/ps-ratio"),
            value: formatRatio(trailing),
          },
          { label: "Market Cap", value: money(marketCap) },
          { label: "Next Revenue (est.)", value: money(next?.revenueAvg) },
          { label: "Estimate Year", value: next ? formatDate(next.date) : "—" },
          { label: "Revenue Analysts", value: next?.numAnalystsRevenue ?? "—" },
        ]}
      />
      <section className="mt-10">
        <h2 className="mb-3 text-lg font-semibold text-header">Implied Forward PS by Year</h2>
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="sa-table">
            <thead>
              <tr>
                <th>Period</th>
                <th className="num">Revenue Est.</th>
                <th className="num">Low – High</th>
                <th className="num">Implied PS</th>
                <th className="num">Analysts</th>
              </tr>
            </thead>
            <tbody>
              {ranked.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-muted">
                    No analyst revenue estimates available.
                  </td>
                </tr>
              ) : (
                ranked.map((row) => (
                  <tr key={row.date}>
                    <td>{formatDate(row.date)}</td>
                    <td className="num">{money(row.revenueAvg)}</td>
                    <td className="num">
                      {row.revenueLow != null && row.revenueHigh != null
                        ? `${money(row.revenueLow)} – ${money(row.revenueHigh)}`
                        : "—"}
                    </td>
                    <td className="num">
                      {formatRatio(
                        marketCap != null && row.revenueAvg && row.revenueAvg > 0 ? marketCap / row.revenueAvg : null,
                      )}
                    </td>
                    <td className="num">{row.numAnalystsRevenue ?? "—"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
      <p className="mt-4 text-sm text-muted">
        Forward PS = Market Cap ÷ next fiscal-year consensus revenue.{" "}
        <Link href={stockPath(ticker, "/forecast")} className="text-link hover:underline">
          Full estimate tables
        </Link>
        {" · "}
        <Link href={stockPath(ticker, "/ps-ratio")} className="text-link hover:underline">
          Trailing PS history
        </Link>
      </p>
    </Container>
  );
}
