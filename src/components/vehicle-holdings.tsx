import { Container } from "@/components/container";
import { HoldingTicker } from "@/components/holding-ticker";
import { PageHeader } from "@/components/page-header";
import { StatGrid } from "@/components/quote-stats";
import { TablePager } from "@/components/table-pager";
import { formatCompactUsd, formatDate, formatInteger, formatPercentPlain, formatPlausiblePe } from "@/lib/format";
import { getEtfCountryWeights, getEtfHoldings, getEtfInfo, getProfile, getQuote } from "@/lib/fmp";
import { decodeTicker } from "@/lib/listings";
import { HOLDINGS_PAGE_SIZE, pageHref, pageNumber, paginate } from "@/lib/paging";
import { parseWeightPercentage } from "@/lib/utils";
import { vehicleNoun, vehiclePath, type VehicleKind } from "@/lib/vehicle";

export async function VehicleHoldings({
  symbol,
  kind,
  page: pageParam,
}: {
  symbol: string;
  kind: VehicleKind;
  page?: string;
}) {
  const ticker = decodeTicker(symbol);
  const noun = vehicleNoun(kind);
  const path = vehiclePath(kind, ticker, "/holdings");
  const [info, holdings, countries, quote, profile] = await Promise.all([
    getEtfInfo(ticker),
    getEtfHoldings(ticker),
    getEtfCountryWeights(ticker),
    getQuote(ticker),
    getProfile(ticker),
  ]);
  const ranked = [...holdings].sort((a, b) => (b.weightPercentage ?? 0) - (a.weightPercentage ?? 0));
  const page = paginate(ranked, pageNumber(pageParam), HOLDINGS_PAGE_SIZE);
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
  const holdingsPageHref = (nextPage: number) => pageHref(path, nextPage);

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
            {page.rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-muted">
                  Holdings are unavailable for this {noun}.
                </td>
              </tr>
            ) : (
              page.rows.map((row, index) => (
                <tr key={`${row.asset}-${row.name}-${page.from + index}`}>
                  <td className="text-muted">{page.from + index}</td>
                  <td className="symbol">
                    <HoldingTicker asset={row.asset} name={row.name} />
                  </td>
                  <td className="max-w-[280px] truncate">{row.name}</td>
                  <td className="num">{formatInteger(row.sharesNumber)}</td>
                  <td className="num">{formatPercentPlain(row.weightPercentage, { alreadyPercent: true })}</td>
                  <td className="num">{formatCompactUsd(row.marketValue)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <TablePager
        from={page.from}
        to={page.to}
        total={page.total}
        page={page.page}
        pageCount={page.pageCount}
        firstHref={page.page > 1 ? holdingsPageHref(1) : undefined}
        prevHref={page.page > 1 ? holdingsPageHref(page.page - 1) : undefined}
        nextHref={page.page < page.pageCount ? holdingsPageHref(page.page + 1) : undefined}
        lastHref={page.page < page.pageCount ? holdingsPageHref(page.pageCount) : undefined}
      />
    </Container>
  );
}
