import Link from "next/link";
import { Container } from "@/components/container";
import { PageHeader } from "@/components/page-header";
import { StatGrid } from "@/components/quote-stats";
import { formatCompactUsd, formatDate, formatInteger, formatPercentPlain, formatPlausiblePe } from "@/lib/format";
import { getEtfCountryWeights, getEtfHoldings, getEtfInfo, getProfile, getQuote } from "@/lib/fmp";
import { decodeTicker, holdingQuoteHref } from "@/lib/listings";
import { parseWeightPercentage } from "@/lib/utils";
import { vehicleNoun, type VehicleKind } from "@/lib/vehicle";

export async function VehicleHoldings({ symbol, kind }: { symbol: string; kind: VehicleKind }) {
  const ticker = decodeTicker(symbol);
  const noun = vehicleNoun(kind);
  const [info, holdings, countries, quote, profile] = await Promise.all([
    getEtfInfo(ticker),
    getEtfHoldings(ticker),
    getEtfCountryWeights(ticker),
    getQuote(ticker),
    getProfile(ticker),
  ]);
  const ranked = [...holdings].sort((a, b) => (b.weightPercentage ?? 0) - (a.weightPercentage ?? 0));
  const shown = ranked.slice(0, 500);
  const count = ranked.length || info?.holdingsCount || 0;
  const top10 = ranked.slice(0, 10).reduce((sum, row) => sum + (row.weightPercentage || 0), 0);
  const asOf = ranked[0]?.updatedAt?.slice(0, 10);
  const rankedCountries = [...countries]
    .map((row) => ({ country: row.country, weight: parseWeightPercentage(row.weightPercentage) }))
    .filter((row) => row.country && row.weight > 0)
    .sort((a, b) => b.weight - a.weight);
  const maxCountry = Math.max(...rankedCountries.map((row) => row.weight), 1);
  const assetClass = info?.assetClass || profile?.sector;
  const category = profile?.industry || info?.assetClass;
  const assetLabel = assetClass?.toLowerCase();
  const article = assetLabel && /^[aeiou]/.test(assetLabel) ? "an" : "a";
  const intro = assetLabel
    ? `${ticker} is ${article} ${assetLabel} ${noun} with a total of ${formatInteger(count)} individual holdings.`
    : `${formatInteger(count)} positions in this ${noun}.`;

  return (
    <Container>
      <PageHeader
        title={`${ticker} Holdings`}
        description={asOf ? `${intro} As of ${formatDate(asOf)}.` : intro}
      />
      <StatGrid
        items={[
          { label: "Total Holdings", value: formatInteger(count) },
          {
            label: "Top 10 Percentage",
            value: top10 > 0 ? formatPercentPlain(top10, { alreadyPercent: true }) : "—",
          },
          { label: "Asset Class", value: assetClass || "—" },
          { label: kind === "etf" ? "ETF Category" : "Category", value: category || "—" },
          { label: "Assets", value: formatCompactUsd(info?.assetsUnderManagement ?? quote?.marketCap) },
          { label: "PE Ratio", value: formatPlausiblePe(quote?.pe) },
        ]}
      />

      {rankedCountries.length > 0 ? (
        <section className="mt-8">
          <h2 className="mb-3 text-xl font-semibold text-header">Breakdown by Country</h2>
          <ul className="flex max-w-xl flex-col gap-3">
            {rankedCountries.map((row) => (
              <li key={row.country}>
                <div className="mb-1 flex justify-between text-sm">
                  <span>{row.country}</span>
                  <span className="tabular text-muted">
                    {formatPercentPlain(row.weight, { alreadyPercent: true })}
                  </span>
                </div>
                <div className="h-2 rounded bg-chip">
                  <div
                    className="h-2 rounded bg-brand"
                    style={{ width: `${Math.min(100, (row.weight / maxCountry) * 100)}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <div className="mt-8 overflow-x-auto rounded-lg border border-border">
        <table className="sa-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Symbol</th>
              <th>Name</th>
              <th className="num">Shares</th>
              <th className="num">Weight</th>
              <th className="num">Market Value</th>
            </tr>
          </thead>
          <tbody>
            {shown.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-muted">
                  Holdings are unavailable for this {noun}.
                </td>
              </tr>
            ) : (
              shown.map((row, index) => {
                const href = holdingQuoteHref(row.asset, row.name);
                return (
                  <tr key={`${row.asset}-${index}`}>
                    <td className="text-muted">{index + 1}</td>
                    <td className="symbol">
                      {href ? (
                        <Link href={href} className="text-link hover:underline">
                          {row.asset}
                        </Link>
                      ) : (
                        row.asset || "—"
                      )}
                    </td>
                    <td className="max-w-[280px] truncate">{row.name}</td>
                    <td className="num">{formatInteger(row.sharesNumber)}</td>
                    <td className="num">{formatPercentPlain(row.weightPercentage, { alreadyPercent: true })}</td>
                    <td className="num">{formatCompactUsd(row.marketValue)}</td>
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
