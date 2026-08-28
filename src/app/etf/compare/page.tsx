import Link from "next/link";
import { Container } from "@/components/container";
import { PageHeader } from "@/components/page-header";
import { SectionNav } from "@/components/section-nav";
import { ChangePercent } from "@/components/change";
import { ComparePerformanceChart } from "@/components/compare-performance-chart";
import { ETF_NAV } from "@/lib/nav";
import { formatCompactUsd, formatInteger, formatPercentPlain, formatPrice, formatRatio } from "@/lib/format";
import { compareChartFrom, compareChartSpan, getNormalizedCompareSeries } from "@/lib/compare";
import { loadEtfCompare, overlappingHoldings, allocationRows, POPULAR_ETF_COMPARISONS, compareTotalReturnBlurb } from "@/lib/etf-compare";
import { holdingQuoteHref, quoteHref } from "@/lib/listings";

export const metadata = {
  title: "Compare ETFs",
  description: "Side-by-side ETF and mutual fund quotes, a normalized price chart, expense ratios, returns, and top holdings from live FMP data.",
};

export default async function EtfComparePage({
  searchParams,
}: {
  searchParams: Promise<{ symbols?: string; chart?: string }>;
}) {
  const { symbols: raw, chart: chartParam } = await searchParams;
  const symbols = (raw ?? "QQQ,SPY")
    .split(",")
    .map((symbol) => symbol.trim().toUpperCase())
    .filter(Boolean)
    .slice(0, 4);
  const span = compareChartSpan(chartParam);
  const [rows, series] = await Promise.all([
    loadEtfCompare(symbols),
    getNormalizedCompareSeries(symbols, compareChartFrom(span)),
  ]);
  const overlap = overlappingHoldings(rows);
  const listQuery = `symbols=${encodeURIComponent(symbols.join(","))}`;

  return (
    <Container>
      <PageHeader
        title="Compare ETFs & Funds"
        description="Live quotes, a normalized price chart, assets, expense ratios, total returns, sector weights, and top-holding overlap from Financial Modeling Prep."
        actions={
          <form method="get" className="flex gap-2">
            {span === "5Y" ? <input type="hidden" name="chart" value="5Y" /> : null}
            <input
              name="symbols"
              defaultValue={symbols.join(",")}
              placeholder="QQQ,SPY,VOO"
              className="h-9 w-56 rounded-md border border-border px-2 text-sm"
            />
            <button className="h-9 rounded-md bg-header px-3 text-sm font-medium text-on-header" type="submit">
              Compare
            </button>
          </form>
        }
      />
      <SectionNav items={ETF_NAV} />

      <div className="mb-10 rounded-lg border border-border p-4">
        <ComparePerformanceChart
          series={series}
          span={span}
          oneHref={`/etf/compare?${listQuery}`}
          fiveHref={`/etf/compare?${listQuery}&chart=5Y`}
        />
      </div>

      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="sa-table">
          <thead>
            <tr>
              <th>Metric</th>
              {rows.map((row) => (
                <th key={row.symbol} className="num">
                  <Link
                    href={quoteHref(row.symbol, {
                      name: row.info?.name ?? row.profile?.companyName,
                      isEtf: row.profile?.isEtf ?? true,
                      isFund: row.profile?.isFund,
                    })}
                    className="text-link hover:underline"
                  >
                    {row.symbol}
                  </Link>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <MetricRow label="Name" rows={rows} render={(row) => row.info?.name ?? row.profile?.companyName ?? row.quote?.name ?? "—"} />
            <MetricRow label="Price" rows={rows} render={(row) => formatPrice(row.quote?.price ?? row.profile?.price)} />
            <tr>
              <td>Change</td>
              {rows.map((row) => (
                <td key={row.symbol} className="num">
                  <ChangePercent value={row.quote?.changePercentage ?? row.profile?.changePercentage} />
                </td>
              ))}
            </tr>
            <MetricRow
              label="Assets"
              rows={rows}
              render={(row) => formatCompactUsd(row.info?.assetsUnderManagement ?? row.quote?.marketCap ?? row.profile?.marketCap)}
            />
            <MetricRow
              label="Expense Ratio"
              rows={rows}
              render={(row) =>
                row.info?.expenseRatio != null ? formatPercentPlain(row.info.expenseRatio, { alreadyPercent: true }) : "—"
              }
            />
            <MetricRow label="Holdings" rows={rows} render={(row) => formatInteger(row.holdingsCount)} />
            <MetricRow
              label="Top Sector"
              rows={rows}
              render={(row) =>
                row.sectors[0]
                  ? `${row.sectors[0].name} (${formatPercentPlain(row.sectors[0].weight, { alreadyPercent: true })})`
                  : "—"
              }
            />
            <MetricRow
              label="Top Country"
              rows={rows}
              render={(row) =>
                row.countries[0]
                  ? `${row.countries[0].name} (${formatPercentPlain(row.countries[0].weight, { alreadyPercent: true })})`
                  : "—"
              }
            />
            <MetricRow
              label="Dividend Yield"
              rows={rows}
              render={(row) => (row.ttmYield != null ? formatPercentPlain(row.ttmYield) : "—")}
            />
            <MetricRow label="TTM Dividend" rows={rows} render={(row) => (row.ttmDividend ? `$${formatPrice(row.ttmDividend)}` : "—")} />
            <MetricRow label="Issuer" rows={rows} render={(row) => row.info?.etfCompany || "—"} />
            <MetricRow label="Asset Class" rows={rows} render={(row) => row.info?.assetClass || row.profile?.industry || "—"} />
            <MetricRow label="Beta" rows={rows} render={(row) => formatRatio(row.profile?.beta)} />
            <MetricRow
              label="52-Week Range"
              rows={rows}
              render={(row) => (row.quote ? `${formatPrice(row.quote.yearLow)} - ${formatPrice(row.quote.yearHigh)}` : "—")}
            />
          </tbody>
        </table>
      </div>

      <AverageReturnSection rows={rows} />

      {overlap.length > 0 ? (
        <section className="mt-10">
          <h2 className="mb-3 text-xl font-semibold text-header">Shared Top Holdings</h2>
          <p className="mb-3 text-sm text-muted">
            Names that appear in every fund&apos;s top 10 holdings from FMP.
          </p>
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="sa-table">
              <thead>
                <tr>
                  <th>Symbol</th>
                  <th>Name</th>
                  {rows.map((row) => (
                    <th key={row.symbol} className="num">
                      {row.symbol}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {overlap.map((item) => {
                  const href = holdingQuoteHref(item.asset, item.name);
                  return (
                    <tr key={item.asset}>
                      <td className="symbol">
                        {href ? (
                          <Link href={href} className="text-link hover:underline">
                            {item.asset}
                          </Link>
                        ) : (
                          item.asset
                        )}
                      </td>
                      <td className="max-w-[240px] truncate">{item.name}</td>
                      {item.weights.map((weight, index) => (
                        <td key={rows[index]?.symbol ?? index} className="num">
                          {formatPercentPlain(weight, { alreadyPercent: true })}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      <AllocationTable title="Sector Allocation" rows={rows} items={allocationRows(rows, "sectors")} />
      <AllocationTable title="Country Allocation" rows={rows} items={allocationRows(rows, "countries")} />

      <section className="mt-10">
        <h2 className="mb-3 text-xl font-semibold text-header">Popular Comparisons</h2>
        <div className="flex flex-wrap gap-2">
          {POPULAR_ETF_COMPARISONS.map(([left, right]) => (
            <Link
              key={`${left}-${right}`}
              href={`/etf/compare/${left.toLowerCase()}-vs-${right.toLowerCase()}`}
              className="rounded-full bg-chip px-3 py-1 text-sm font-medium text-header hover:bg-border"
            >
              {left} vs {right}
            </Link>
          ))}
        </div>
      </section>
    </Container>
  );
}

function AverageReturnSection({ rows }: { rows: Awaited<ReturnType<typeof loadEtfCompare>> }) {
  const blurb = compareTotalReturnBlurb(rows);
  const periods = [
    { key: "ytd", label: "Year-to-date" },
    { key: "oneYear", label: "1 Year" },
    { key: "fiveYear", label: "5 Years" },
    { key: "tenYear", label: "10 Years" },
    { key: "inceptionCagr", label: "Inception" },
  ] as const;

  return (
    <section className="mt-10">
      <h2 className="mb-2 text-xl font-semibold text-header">Average Return</h2>
      {blurb ? (
        <p className="mb-4 max-w-4xl text-sm leading-7 text-header/90">
          In the past year, {blurb.lead} returned a total of {formatPercentPlain(blurb.leadReturn)}, including
          dividends, compared with {blurb.trail}&apos;s {formatPercentPlain(blurb.trailReturn)}. Periods longer than one
          year are annualized from FMP dividend-adjusted prices.
        </p>
      ) : (
        <p className="mb-4 max-w-4xl text-sm text-muted">
          Total return including dividends from FMP dividend-adjusted prices. Periods longer than one year are
          annualized.
        </p>
      )}
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="sa-table">
          <thead>
            <tr>
              <th>Period</th>
              {rows.map((row) => (
                <th key={row.symbol} className="num">
                  {row.symbol}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {periods.map((period) => (
              <tr key={period.key}>
                <td>{period.label}</td>
                {rows.map((row) => (
                  <td key={row.symbol} className="num">
                    <ChangePercent value={row.performance?.[period.key] ?? null} alreadyPercent={false} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function AllocationTable({
  title,
  rows,
  items,
}: {
  title: string;
  rows: Awaited<ReturnType<typeof loadEtfCompare>>;
  items: { name: string; weights: Array<number | null> }[];
}) {
  if (items.length === 0) return null;
  return (
    <section className="mt-10">
      <h2 className="mb-3 text-xl font-semibold text-header">{title}</h2>
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="sa-table">
          <thead>
            <tr>
              <th>{title.startsWith("Sector") ? "Sector" : "Country"}</th>
              {rows.map((row) => (
                <th key={row.symbol} className="num">
                  {row.symbol}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.name}>
                <td>{item.name}</td>
                {item.weights.map((weight, index) => (
                  <td key={rows[index]?.symbol ?? index} className="num">
                    {formatPercentPlain(weight, { alreadyPercent: true })}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function MetricRow({
  label,
  rows,
  render,
}: {
  label: string;
  rows: Awaited<ReturnType<typeof loadEtfCompare>>;
  render: (row: Awaited<ReturnType<typeof loadEtfCompare>>[number]) => string;
}) {
  return (
    <tr>
      <td>{label}</td>
      {rows.map((row) => (
        <td key={row.symbol} className="num">
          {render(row)}
        </td>
      ))}
    </tr>
  );
}
