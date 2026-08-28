import { Container } from "@/components/container";
import { MetricCards } from "@/components/metric-cards";
import { PageHeader } from "@/components/page-header";
import { SectionNav } from "@/components/section-nav";
import { formatDate, formatNumber } from "@/lib/format";
import { getEsgDisclosures, getEsgRatings } from "@/lib/fmp";
import { decodeTicker, stockPath } from "@/lib/listings";
import { companyNav } from "@/lib/nav";
import Link from "next/link";

export default async function EsgPage({ params }: { params: Promise<{ symbol: string }> }) {
  const { symbol } = await params;
  const ticker = decodeTicker(symbol);
  const [esgRatings, esgDisclosures] = await Promise.all([getEsgRatings(ticker), getEsgDisclosures(ticker)]);
  const esgRating = [...esgRatings].sort((a, b) => (b.fiscalYear ?? 0) - (a.fiscalYear ?? 0))[0] ?? null;
  const esg = esgDisclosures[0] ?? null;
  const history = [...esgRatings].sort((a, b) => (b.fiscalYear ?? 0) - (a.fiscalYear ?? 0));

  return (
    <Container>
      <PageHeader
        title={`${ticker} ESG`}
        description="Environmental, social, and governance scores from live FMP ESG ratings and SEC disclosures."
      />
      <SectionNav items={companyNav(ticker)} />
      {esgRating || esg ? (
        <>
          <MetricCards
            items={[
              { label: "ESG Rating", value: esgRating?.ESGRiskRating ?? "—" },
              { label: "Industry Rank", value: esgRating?.industryRank ?? "—" },
              { label: "ESG Score", value: esg?.ESGScore != null ? formatNumber(esg.ESGScore) : "—" },
              {
                label: "Environmental",
                value: esg?.environmentalScore != null ? formatNumber(esg.environmentalScore) : "—",
              },
              { label: "Social", value: esg?.socialScore != null ? formatNumber(esg.socialScore) : "—" },
              { label: "Governance", value: esg?.governanceScore != null ? formatNumber(esg.governanceScore) : "—" },
            ]}
          />
          <p className="mt-2 text-sm text-muted">
            Rating year {esgRating?.fiscalYear ?? "—"}. Disclosure as of {formatDate(esg?.date)}
            {esg?.url ? (
              <>
                {" "}
                ·{" "}
                <a href={esg.url} className="text-link hover:underline" target="_blank" rel="noreferrer">
                  {esg.formType || "SEC"}
                </a>
              </>
            ) : null}
            .
          </p>
        </>
      ) : (
        <p className="text-sm text-muted">No ESG rating or disclosure is available for {ticker}.</p>
      )}
      {history.length > 0 ? (
        <section className="mt-10">
          <h2 className="mb-3 text-lg font-semibold text-header">Rating History</h2>
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="sa-table">
              <thead>
                <tr>
                  <th>Year</th>
                  <th>Rating</th>
                  <th>Industry Rank</th>
                </tr>
              </thead>
              <tbody>
                {history.map((row) => (
                  <tr key={`${row.symbol}-${row.fiscalYear}`}>
                    <td>{row.fiscalYear}</td>
                    <td>{row.ESGRiskRating || "—"}</td>
                    <td>{row.industryRank || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}
      <p className="mt-6 text-sm">
        <Link href={stockPath(ticker, "/company")} className="text-link hover:underline">
          Company profile
        </Link>
        {" · "}
        <Link href={stockPath(ticker, "/statistics")} className="text-link hover:underline">
          Statistics
        </Link>
      </p>
    </Container>
  );
}
