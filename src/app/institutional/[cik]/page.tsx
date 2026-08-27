import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/container";
import { PageHeader } from "@/components/page-header";
import { SectionNav } from "@/components/section-nav";
import { MetricCards } from "@/components/metric-cards";
import { CONGRESS_NAV } from "@/lib/nav";
import { formatCompactUsd, formatDate, formatInteger, formatPercentPlain } from "@/lib/format";
import { loadInstitutionalPortfolio, padCik } from "@/lib/institutional";
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
  const { name, period, holdings, filing } = await loadInstitutionalPortfolio(padded);
  const title = name ?? filing?.name ?? `CIK ${padded}`;
  const ranked = [...holdings].sort((a, b) => (b.value || 0) - (a.value || 0));
  const equity = ranked.filter((row) => {
    const kind = (row.putCallShare || "").toLowerCase();
    return kind !== "put" && kind !== "call";
  });
  const totalValue = equity.reduce((sum, row) => sum + (row.value || 0), 0);
  const top = equity.slice(0, 100);

  return (
    <Container>
      <PageHeader
        title={`${title} 13F Holdings`}
        description="Equity positions from the latest Form 13F extract. Values are as reported by FMP for the filing period."
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
          { label: "Positions", value: formatInteger(equity.length) },
          { label: "Reported Value", value: formatCompactUsd(totalValue) },
          {
            label: "Top Holding",
            value: top[0]?.symbol || "—",
            hint: top[0] ? formatCompactUsd(top[0].value) : undefined,
          },
        ]}
      />

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
