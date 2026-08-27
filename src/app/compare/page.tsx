import type { ReactNode } from "react";
import Link from "next/link";
import { Container } from "@/components/container";
import { PageHeader } from "@/components/page-header";
import { ChangePercent } from "@/components/change";
import {
  formatAnalystConsensus,
  formatCompactUsd,
  formatInteger,
  formatPercentPlain,
  formatPlausiblePe,
  formatPrice,
  formatRatio,
} from "@/lib/format";
import { getProfilesAndQuotes, POPULAR_STOCK_COMPARISONS } from "@/lib/compare";
import { industryHref, sectorHref } from "@/lib/industries";
import { quoteHref } from "@/lib/listings";
import { forwardPe, forwardPs } from "@/lib/valuation";

type CompareRow = Awaited<ReturnType<typeof getProfilesAndQuotes>>[number];

function num(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function MetricRow({
  label,
  rows,
  children,
}: {
  label: string;
  rows: CompareRow[];
  children: (row: CompareRow) => ReactNode;
}) {
  return (
    <tr>
      <td>{label}</td>
      {rows.map((row) => (
        <td key={row.symbol} className="num">
          {children(row)}
        </td>
      ))}
    </tr>
  );
}

function pegRatio(row: CompareRow) {
  return num(row.ratios?.priceToEarningsGrowthRatioTTM) ?? num(row.metrics?.pegRatioTTM);
}

function targetUpside(row: CompareRow) {
  const price = num(row.quote?.price);
  const target = num(row.target?.targetConsensus ?? row.target?.targetMedian);
  if (price == null || price <= 0 || target == null || target <= 0) return null;
  return target / price - 1;
}

export default async function ComparePage({
  searchParams,
}: {
  searchParams: Promise<{ symbols?: string }>;
}) {
  const { symbols: raw } = await searchParams;
  const symbols = (raw ?? "AAPL,MSFT,GOOGL")
    .split(",")
    .map((symbol) => symbol.trim().toUpperCase())
    .filter(Boolean)
    .slice(0, 4);
  const rows = await getProfilesAndQuotes(symbols);

  return (
    <Container>
      <PageHeader
        title="Compare Stocks"
        description="Side-by-side quotes, forward valuation, analyst targets, and trailing financials from live FMP data."
        actions={
          <div className="flex flex-wrap items-center gap-3">
            <form method="get" className="flex gap-2">
            <input
              name="symbols"
              defaultValue={symbols.join(",")}
              placeholder="AAPL,MSFT,NVDA"
              className="h-9 w-56 rounded-md border border-border px-2 text-sm"
            />
            <button className="h-9 rounded-md bg-header px-3 text-sm font-medium text-on-header" type="submit">
              Compare
            </button>
            </form>
            <Link href="/etf/compare" className="text-sm text-link hover:underline">
              Compare ETFs
            </Link>
          </div>
        }
      />
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="sa-table">
          <thead>
            <tr>
              <th>Metric</th>
              {rows.map((row) => (
                <th key={row.symbol} className="num">
                  <Link
                    href={quoteHref(row.symbol, { name: row.quote?.name ?? row.profile?.companyName, isEtf: row.profile?.isEtf })}
                    className="text-link hover:underline"
                  >
                    {row.symbol}
                  </Link>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <MetricRow label="Name" rows={rows}>
              {(row) => row.profile?.companyName ?? row.quote?.name ?? "—"}
            </MetricRow>
            <MetricRow label="Price" rows={rows}>
              {(row) => formatPrice(row.quote?.price)}
            </MetricRow>
            <MetricRow label="Change" rows={rows}>
              {(row) => <ChangePercent value={row.quote?.changePercentage} />}
            </MetricRow>
            <MetricRow label="Market Cap" rows={rows}>
              {(row) => formatCompactUsd(row.quote?.marketCap ?? row.profile?.marketCap)}
            </MetricRow>
            <MetricRow label="Revenue (ttm)" rows={rows}>
              {(row) => formatCompactUsd(row.ttm?.revenue)}
            </MetricRow>
            <MetricRow label="Net Income (ttm)" rows={rows}>
              {(row) => formatCompactUsd(row.ttm?.netIncome)}
            </MetricRow>
            <MetricRow label="Free Cash Flow (ttm)" rows={rows}>
              {(row) => formatCompactUsd(row.cash?.freeCashFlow)}
            </MetricRow>
            <MetricRow label="EPS (ttm)" rows={rows}>
              {(row) =>
                row.ttm?.epsDiluted != null || row.ttm?.eps != null
                  ? `$${formatPrice(row.ttm.epsDiluted ?? row.ttm.eps)}`
                  : "—"
              }
            </MetricRow>
            <MetricRow label="YTD" rows={rows}>
              {(row) => <ChangePercent value={row.changes?.ytd} />}
            </MetricRow>
            <MetricRow label="1 Year" rows={rows}>
              {(row) => <ChangePercent value={row.changes?.["1Y"]} />}
            </MetricRow>
            <MetricRow label="5 Year" rows={rows}>
              {(row) => <ChangePercent value={row.changes?.["5Y"]} />}
            </MetricRow>
            <MetricRow label="PE Ratio" rows={rows}>
              {(row) => formatPlausiblePe(row.ratios?.priceToEarningsRatioTTM ?? row.quote?.pe)}
            </MetricRow>
            <MetricRow label="Forward PE" rows={rows}>
              {(row) => formatPlausiblePe(forwardPe(row.quote?.price, row.estimates))}
            </MetricRow>
            <MetricRow label="PEG Ratio" rows={rows}>
              {(row) => formatRatio(pegRatio(row))}
            </MetricRow>
            <MetricRow label="PS Ratio" rows={rows}>
              {(row) => formatRatio(row.ratios?.priceToSalesRatioTTM)}
            </MetricRow>
            <MetricRow label="Forward PS" rows={rows}>
              {(row) => formatRatio(forwardPs(row.quote?.marketCap ?? row.profile?.marketCap, row.estimates))}
            </MetricRow>
            <MetricRow label="PB Ratio" rows={rows}>
              {(row) => formatRatio(row.ratios?.priceToBookRatioTTM)}
            </MetricRow>
            <MetricRow label="P/FCF" rows={rows}>
              {(row) => formatRatio(row.ratios?.priceToFreeCashFlowRatioTTM)}
            </MetricRow>
            <MetricRow label="EV / EBITDA" rows={rows}>
              {(row) => formatRatio(num(row.metrics?.evToEBITDATTM))}
            </MetricRow>
            <MetricRow label="ROE" rows={rows}>
              {(row) => formatPercentPlain(num(row.metrics?.returnOnEquityTTM))}
            </MetricRow>
            <MetricRow label="ROIC" rows={rows}>
              {(row) => formatPercentPlain(num(row.metrics?.returnOnInvestedCapitalTTM))}
            </MetricRow>
            <MetricRow label="ROA" rows={rows}>
              {(row) => formatPercentPlain(num(row.metrics?.returnOnAssetsTTM))}
            </MetricRow>
            <MetricRow label="Dividend Yield" rows={rows}>
              {(row) => formatPercentPlain(num(row.ratios?.dividendYieldTTM))}
            </MetricRow>
            <MetricRow label="Profit Margin" rows={rows}>
              {(row) => formatPercentPlain(num(row.ratios?.netProfitMarginTTM))}
            </MetricRow>
            <MetricRow label="Analyst Consensus" rows={rows}>
              {(row) => formatAnalystConsensus(row.grades)}
            </MetricRow>
            <MetricRow label="Price Target" rows={rows}>
              {(row) => formatPrice(row.target?.targetConsensus ?? row.target?.targetMedian)}
            </MetricRow>
            <MetricRow label="Upside" rows={rows}>
              {(row) => <ChangePercent value={targetUpside(row)} alreadyPercent={false} />}
            </MetricRow>
            <MetricRow label="Employees" rows={rows}>
              {(row) => formatInteger(row.profile?.fullTimeEmployees ? Number(row.profile.fullTimeEmployees) : null)}
            </MetricRow>
            <MetricRow label="Country" rows={rows}>
              {(row) => row.profile?.country ?? "—"}
            </MetricRow>
            <MetricRow label="Sector" rows={rows}>
              {(row) =>
                row.profile?.sector ? (
                  <Link href={sectorHref(row.profile.sector)} className="text-link hover:underline">
                    {row.profile.sector}
                  </Link>
                ) : (
                  "—"
                )
              }
            </MetricRow>
            <MetricRow label="Industry" rows={rows}>
              {(row) =>
                row.profile?.industry ? (
                  <Link href={industryHref(row.profile.industry)} className="text-link hover:underline">
                    {row.profile.industry}
                  </Link>
                ) : (
                  "—"
                )
              }
            </MetricRow>
            <MetricRow label="Beta" rows={rows}>
              {(row) => formatRatio(row.profile?.beta)}
            </MetricRow>
            <MetricRow label="52-Week Range" rows={rows}>
              {(row) => (row.quote ? `${formatPrice(row.quote.yearLow)} - ${formatPrice(row.quote.yearHigh)}` : "—")}
            </MetricRow>
          </tbody>
        </table>
      </div>

      <section className="mt-10">
        <h2 className="mb-3 text-xl font-semibold text-header">Popular Comparisons</h2>
        <div className="flex flex-wrap gap-2">
          {POPULAR_STOCK_COMPARISONS.map(([left, right]) => (
            <Link
              key={`${left}-${right}`}
              href={`/compare/${left.toLowerCase()}-vs-${right.toLowerCase()}`}
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
