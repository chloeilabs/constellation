import { Container } from "@/components/container";
import { MetricCards } from "@/components/metric-cards";
import { PageHeader } from "@/components/page-header";
import { SectionNav } from "@/components/section-nav";
import { matchEsgBenchmark } from "@/lib/esg";
import { formatDate, formatNumber } from "@/lib/format";
import { getEsgBenchmarks, getEsgDisclosures, getEsgRatings, getProfile } from "@/lib/fmp";
import { decodeTicker, stockPath } from "@/lib/listings";
import { companyNav } from "@/lib/nav";
import Link from "next/link";

export default async function EsgPage({ params }: { params: Promise<{ symbol: string }> }) {
  const { symbol } = await params;
  const ticker = decodeTicker(symbol);
  const [esgRatings, esgDisclosures, benchmarks, profile] = await Promise.all([
    getEsgRatings(ticker),
    getEsgDisclosures(ticker),
    getEsgBenchmarks(),
    getProfile(ticker),
  ]);
  const esgRating = [...esgRatings].sort((a, b) => (b.fiscalYear ?? 0) - (a.fiscalYear ?? 0))[0] ?? null;
  const esg = esgDisclosures[0] ?? null;
  const history = [...esgRatings].sort((a, b) => (b.fiscalYear ?? 0) - (a.fiscalYear ?? 0));
  const industry = esgRating?.industry || profile?.industry || null;
  const industryBench = matchEsgBenchmark(benchmarks, industry, esgRating?.fiscalYear);

  return (
    <Container>
      <PageHeader
        title={`${ticker} ESG`}
        description="Environmental, social, and governance scores from live FMP ESG ratings, SEC disclosures, and the matching industry FY benchmark."
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
              {
                label: "Industry ESG",
                value: industryBench?.ESGScore != null ? formatNumber(industryBench.ESGScore) : "—",
                hint: industryBench
                  ? `${industryBench.sector} FY${industryBench.fiscalYear}`
                  : industry || undefined,
              },
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
      {industryBench ? (
        <section className="mt-10">
          <h2 className="mb-3 text-lg font-semibold text-header">
            {industryBench.sector} Benchmark (FY{industryBench.fiscalYear})
          </h2>
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="sa-table">
              <thead>
                <tr>
                  <th></th>
                  <th className="num">ESG</th>
                  <th className="num">Environmental</th>
                  <th className="num">Social</th>
                  <th className="num">Governance</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="font-medium">{ticker}</td>
                  <td className="num">{esg?.ESGScore != null ? formatNumber(esg.ESGScore) : "—"}</td>
                  <td className="num">
                    {esg?.environmentalScore != null ? formatNumber(esg.environmentalScore) : "—"}
                  </td>
                  <td className="num">{esg?.socialScore != null ? formatNumber(esg.socialScore) : "—"}</td>
                  <td className="num">{esg?.governanceScore != null ? formatNumber(esg.governanceScore) : "—"}</td>
                </tr>
                <tr>
                  <td className="font-medium">Industry average</td>
                  <td className="num">{formatNumber(industryBench.ESGScore)}</td>
                  <td className="num">{formatNumber(industryBench.environmentalScore)}</td>
                  <td className="num">{formatNumber(industryBench.socialScore)}</td>
                  <td className="num">{formatNumber(industryBench.governanceScore)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      ) : null}
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
