import Link from "next/link";
import { Container } from "@/components/container";
import { PageHeader } from "@/components/page-header";
import { SectionNav } from "@/components/section-nav";
import { quoteFundamentalsNav } from "@/lib/nav";
import { MetricCards } from "@/components/metric-cards";
import { formatDate, formatMoney, formatRatio } from "@/lib/format";
import { getEstimates, getIncomeTtm, getProfile, getQuote, getRatiosTtm } from "@/lib/fmp";
import { decodeTicker, stockPath } from "@/lib/listings";
import { forwardPe, futureEstimates, nextEstimate, trailingPe } from "@/lib/valuation";

function num(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

export default async function ForwardPePage({ params }: { params: Promise<{ symbol: string }> }) {
  const { symbol } = await params;
  const ticker = decodeTicker(symbol);
  const [quote, profile, estimates, ratios, ttm] = await Promise.all([
    getQuote(ticker),
    getProfile(ticker),
    getEstimates(ticker, "annual"),
    getRatiosTtm(ticker),
    getIncomeTtm(ticker),
  ]);
  const currency = profile?.currency || "USD";
  const price = num(quote?.price);
  const next = nextEstimate(estimates);
  const fwd = forwardPe(price, estimates);
  const trailing = trailingPe(price, ttm?.epsDiluted ?? ttm?.eps) ?? num(ratios?.priceToEarningsRatioTTM) ?? num(quote?.pe);
  const ranked = futureEstimates(estimates);

  return (
    <Container>
      <PageHeader
        title={`${ticker} Forward PE`}
        description="Share price divided by the next annual consensus EPS estimate from live FMP analyst estimates."
      />
      <SectionNav items={quoteFundamentalsNav(ticker)} />
      <MetricCards
        items={[
          { label: "Forward PE", value: formatRatio(fwd) },
          {
            label: "Trailing PE",
            href: stockPath(ticker, "/pe-ratio"),
            value: formatRatio(trailing),
          },
          { label: "Stock Price", value: formatMoney(price, currency) },
          { label: "Next EPS (est.)", value: formatMoney(next?.epsAvg, currency) },
          { label: "Estimate Year", value: next ? formatDate(next.date) : "—" },
          { label: "EPS Analysts", value: next?.numAnalystsEps ?? "—" },
        ]}
      />
      <section className="mt-10">
        <h2 className="mb-3 text-lg font-semibold text-header">Implied Forward PE by Year</h2>
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="sa-table">
            <thead>
              <tr>
                <th>Period</th>
                <th className="num">EPS Est.</th>
                <th className="num">Low – High</th>
                <th className="num">Implied PE</th>
                <th className="num">Analysts</th>
              </tr>
            </thead>
            <tbody>
              {ranked.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-muted">
                    No analyst EPS estimates available.
                  </td>
                </tr>
              ) : (
                ranked.map((row) => (
                  <tr key={row.date}>
                    <td>{formatDate(row.date)}</td>
                    <td className="num">{formatMoney(row.epsAvg, currency)}</td>
                    <td className="num">
                      {row.epsLow != null && row.epsHigh != null
                        ? `${formatMoney(row.epsLow, currency)} – ${formatMoney(row.epsHigh, currency)}`
                        : "—"}
                    </td>
                    <td className="num">
                      {formatRatio(price != null && row.epsAvg && row.epsAvg > 0 ? price / row.epsAvg : null)}
                    </td>
                    <td className="num">{row.numAnalystsEps ?? "—"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
      <p className="mt-4 text-sm text-muted">
        Forward PE = Price ÷ next fiscal-year consensus EPS. Trailing PE is last price divided by diluted EPS (ttm).{" "}
        <Link href={stockPath(ticker, "/forecast")} className="text-link hover:underline">
          Full estimate tables
        </Link>
        {" · "}
        <Link href={stockPath(ticker, "/pe-ratio")} className="text-link hover:underline">
          PE history vs sector
        </Link>
      </p>
    </Container>
  );
}
