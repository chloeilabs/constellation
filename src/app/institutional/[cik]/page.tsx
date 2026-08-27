import Link from "next/link";
import { notFound } from "next/navigation";
import { ChangePercent } from "@/components/change";
import { Container } from "@/components/container";
import { MetricCards } from "@/components/metric-cards";
import { PageHeader } from "@/components/page-header";
import { SectionNav } from "@/components/section-nav";
import { CONGRESS_NAV } from "@/lib/nav";
import { formatCompactUsd, formatDate, formatInteger, formatPercentPlain } from "@/lib/format";
import { loadInstitutionalPortfolio, padCik, titleCaseIndustry } from "@/lib/institutional";
import { quoteHref } from "@/lib/listings";

export async function generateMetadata({ params }: { params: Promise<{ cik: string }> }) {
  const { cik } = await params;
  const padded = padCik(cik);
  const portfolio = padded ? await loadInstitutionalPortfolio(padded) : null;
  const name = portfolio?.name ?? `CIK ${padded}`;
  return {
    title: `${name} 13F Holdings`,
    description: `Latest Form 13F holdings for ${name} from Financial Modeling Prep.`,
  };
}

export default async function InstitutionalFilerPage({ params }: { params: Promise<{ cik: string }> }) {
  const { cik } = await params;
  const padded = padCik(cik);
  if (!padded) notFound();
  const { name, period, holdings, filing, latestPerformance, performance, industries } =
    await loadInstitutionalPortfolio(padded);
  const title = name ?? filing?.name ?? `CIK ${padded}`;
  const ranked = [...holdings].sort((a, b) => (b.value || 0) - (a.value || 0));
  const equity = ranked.filter((row) => {
    const kind = (row.putCallShare || "").toLowerCase();
    return kind !== "put" && kind !== "call";
  });
  const totalValue = equity.reduce((sum, row) => sum + (row.value || 0), 0);
  const top = equity.slice(0, 100);
  const history = performance.slice(0, 8);
  const mix = industries.slice(0, 15);
  const marketValue = latestPerformance?.marketValue || totalValue;

  return (
    <Container>
      <PageHeader
        title={`${title} 13F Holdings`}
        description="Equity positions from the latest Form 13F extract, with FMP performance and industry mix."
      />
      <SectionNav items={CONGRESS_NAV} />
      {period ? (
        <p className="mb-4 text-sm text-muted">
          Q{period.quarter} {period.year}
          {ranked[0]?.date ? ` · period ending ${formatDate(ranked[0].date)}` : null}
          {ranked[0]?.filingDate ? ` · filed ${formatDate(ranked[0].filingDate)}` : null}
          {" · "}
          CIK {padded}
        </p>
      ) : (
        <p className="mb-4 text-sm text-muted">No 13F filing dates found for CIK {padded}.</p>
      )}
      <MetricCards
        items={[
          { label: "Positions", value: formatInteger(latestPerformance?.portfolioSize || equity.length) },
          { label: "Reported Value", value: formatCompactUsd(marketValue) },
          {
            label: "Value Change",
            value: (
              <ChangePercent value={latestPerformance?.changeInMarketValuePercentage} alreadyPercent />
            ),
            hint: latestPerformance ? formatCompactUsd(latestPerformance.changeInMarketValue) : undefined,
          },
          {
            label: "Period Return",
            value: <ChangePercent value={latestPerformance?.performancePercentage} alreadyPercent />,
            hint: latestPerformance
              ? `vs S&P ${formatPercentPlain(latestPerformance.performanceRelativeToSP500Percentage, { alreadyPercent: true })}`
              : undefined,
          },
          {
            label: "1-Year Return",
            value: <ChangePercent value={latestPerformance?.performancePercentage1year} alreadyPercent />,
            hint: latestPerformance
              ? `vs S&P ${formatPercentPlain(latestPerformance.performance1yearRelativeToSP500Percentage, { alreadyPercent: true })}`
              : undefined,
          },
          {
            label: "Top Holding",
            value: top[0]?.symbol || "—",
            hint: top[0] ? formatCompactUsd(top[0].value) : undefined,
          },
        ]}
      />

      {mix.length > 0 ? (
        <section className="mt-10">
          <h2 className="mb-3 text-lg font-semibold text-header">Industry Mix</h2>
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="sa-table">
              <thead>
                <tr>
                  <th>Industry</th>
                  <th className="num">Weight</th>
                  <th className="num">Prior</th>
                  <th className="num">Change</th>
                </tr>
              </thead>
              <tbody>
                {mix.map((row) => (
                  <tr key={row.industryTitle}>
                    <td className="max-w-[320px] truncate">{titleCaseIndustry(row.industryTitle)}</td>
                    <td className="num">{formatPercentPlain(row.weight, { alreadyPercent: true })}</td>
                    <td className="num">{formatPercentPlain(row.lastWeight, { alreadyPercent: true })}</td>
                    <td className="num">
                      <ChangePercent value={row.changeInWeight} alreadyPercent />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {history.length > 0 ? (
        <section className="mt-10">
          <h2 className="mb-3 text-lg font-semibold text-header">Portfolio History</h2>
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="sa-table">
              <thead>
                <tr>
                  <th>Period</th>
                  <th className="num">Value</th>
                  <th className="num">Positions</th>
                  <th className="num">Added</th>
                  <th className="num">Removed</th>
                  <th className="num">Return</th>
                  <th className="num">vs S&P 500</th>
                </tr>
              </thead>
              <tbody>
                {history.map((row) => (
                  <tr key={row.date}>
                    <td>{formatDate(row.date)}</td>
                    <td className="num">{formatCompactUsd(row.marketValue)}</td>
                    <td className="num">{formatInteger(row.portfolioSize)}</td>
                    <td className="num">{formatInteger(row.securitiesAdded)}</td>
                    <td className="num">{formatInteger(row.securitiesRemoved)}</td>
                    <td className="num">
                      <ChangePercent value={row.performancePercentage} alreadyPercent />
                    </td>
                    <td className="num">
                      <ChangePercent value={row.performanceRelativeToSP500Percentage} alreadyPercent />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      <section className="mt-10">
        <h2 className="mb-3 text-lg font-semibold text-header">Holdings</h2>
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="sa-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Symbol</th>
                <th>Issuer</th>
                <th className="num">Shares</th>
                <th className="num">Value</th>
                <th className="num">Weight</th>
                <th>Class</th>
              </tr>
            </thead>
            <tbody>
              {top.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-muted">
                    No 13F holdings extract is available for this filer.
                  </td>
                </tr>
              ) : (
                top.map((row, index) => {
                  const href = row.symbol ? quoteHref(row.symbol) : null;
                  return (
                    <tr key={`${row.symbol}-${row.securityCusip}-${index}`}>
                      <td className="text-muted">{index + 1}</td>
                      <td className="symbol">
                        {href ? (
                          <Link href={href} className="text-link hover:underline">
                            {row.symbol}
                          </Link>
                        ) : (
                          row.symbol || "—"
                        )}
                      </td>
                      <td className="max-w-[280px] truncate">{row.nameOfIssuer}</td>
                      <td className="num">{formatInteger(row.shares)}</td>
                      <td className="num">{formatCompactUsd(row.value)}</td>
                      <td className="num">
                        {formatPercentPlain(totalValue > 0 ? (row.value / totalValue) * 100 : null, {
                          alreadyPercent: true,
                        })}
                      </td>
                      <td className="text-muted">{row.titleOfClass || row.putCallShare || "—"}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        {ranked[0]?.link ? (
          <p className="mt-2 text-sm text-muted">
            <a href={ranked[0].link} className="text-link hover:underline" target="_blank" rel="noreferrer">
              SEC filing
            </a>
            {ranked[0].finalLink ? (
              <>
                {" · "}
                <a href={ranked[0].finalLink} className="text-link hover:underline" target="_blank" rel="noreferrer">
                  Holdings table
                </a>
              </>
            ) : null}
          </p>
        ) : null}
      </section>
    </Container>
  );
}
