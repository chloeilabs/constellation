import Link from "next/link";
import { Container } from "@/components/container";
import { PageHeader } from "@/components/page-header";
import { SectionNav } from "@/components/section-nav";
import { quoteFundamentalsNav } from "@/lib/nav";
import { HistoryBars } from "@/components/history-bars";
import { MetricCards } from "@/components/metric-cards";
import { ChangePercent } from "@/components/change";
import { formatCompactUsd, formatDate, formatInteger, formatPercentPlain } from "@/lib/format";
import { TablePager } from "@/components/table-pager";
import { getBeneficialOwnership, getFundDisclosureHolders, getInstitutionalOwnershipHistory, getLatestInstitutionalOwnership } from "@/lib/fmp";
import { institutionalHref } from "@/lib/institutional";
import { decodeTicker, stockPath } from "@/lib/listings";
import {
  disclosureWeightPercent,
  latestBeneficialOwners,
  latestFundHolders,
  parseBeneficialPercent,
  parseBeneficialShares,
  reportingPersonType,
} from "@/lib/markets";
import { pageNumber, pageWindow, paginate, pagerLinks } from "@/lib/paging";

export default async function OwnershipPage({
  params,
  searchParams,
}: {
  params: Promise<{ symbol: string }>;
  searchParams: Promise<{ page?: string; funds?: string }>;
}) {
  const { symbol } = await params;
  const { page: pageParam, funds: fundsParam } = await searchParams;
  const ticker = decodeTicker(symbol);
  const requestedPage = pageNumber(pageParam);
  const [{ summary, year, quarter, holders, holderTotal }, history, beneficial, fundDisclosures] = await Promise.all([
    getLatestInstitutionalOwnership(ticker, { page: requestedPage }),
    getInstitutionalOwnershipHistory(ticker, 8),
    getBeneficialOwnership(ticker),
    getFundDisclosureHolders(ticker),
  ]);
  const holdersPage = pageWindow(holderTotal, requestedPage);
  const shownHolders =
    holdersPage.from === 0 ? [] : holders.slice(0, holdersPage.to - holdersPage.from + 1);
  const owners = latestBeneficialOwners(beneficial);
  const fundHolders = paginate(latestFundHolders(fundDisclosures), pageNumber(fundsParam));
  const base = stockPath(ticker, "/ownership");
  const holderExtra = { funds: fundHolders.page > 1 ? String(fundHolders.page) : undefined };
  const fundExtra = { page: holdersPage.page > 1 ? String(holdersPage.page) : undefined };
  const holderLinks = pagerLinks(base, holdersPage.page, holdersPage.pageCount, holderExtra);
  const fundLinks = pagerLinks(base, fundHolders.page, fundHolders.pageCount, fundExtra, "funds");
  const holderTo = shownHolders.length ? holdersPage.from + shownHolders.length - 1 : 0;

  return (
    <Container>
      <PageHeader
        title={`${ticker} Institutional Ownership`}
        description="13F positions, fund and ETF disclosures, Schedule 13G/13D beneficial owners, and changes versus the prior quarter."
      />
      <SectionNav items={quoteFundamentalsNav(ticker)} />
      {summary ? (
        <>
          <p className="mb-4 text-sm text-muted">
            Latest 13F snapshot: Q{quarter} {year} (period ending {formatDate(summary.date)}). Ownership can exceed 100%
            when short interest, options, and overlapping filings are included.
          </p>
          <MetricCards
            items={[
              {
                label: "Institutions",
                value: formatInteger(summary.investorsHolding),
                hint: `${summary.investorsHoldingChange >= 0 ? "+" : ""}${formatInteger(summary.investorsHoldingChange)} vs prior quarter`,
              },
              {
                label: "Ownership",
                value: formatPercentPlain(summary.ownershipPercent, { alreadyPercent: true }),
                hint: `${summary.ownershipPercentChange >= 0 ? "+" : ""}${summary.ownershipPercentChange.toFixed(2)} pts`,
              },
              {
                label: "13F Shares",
                value: formatInteger(summary.numberOf13Fshares),
                hint: `${summary.numberOf13FsharesChange >= 0 ? "+" : ""}${formatInteger(summary.numberOf13FsharesChange)}`,
              },
              {
                label: "Invested Value",
                value: formatCompactUsd(summary.totalInvested),
                hint: `${summary.totalInvestedChange >= 0 ? "+" : "−"}${formatCompactUsd(Math.abs(summary.totalInvestedChange))}`,
              },
              {
                label: "New / Closed",
                value: `${formatInteger(summary.newPositions)} / ${formatInteger(summary.closedPositions)}`,
              },
              {
                label: "Increased / Reduced",
                value: `${formatInteger(summary.increasedPositions)} / ${formatInteger(summary.reducedPositions)}`,
              },
              {
                label: "Put / Call",
                value: summary.putCallRatio?.toFixed(2) ?? "—",
              },
            ]}
          />
        </>
      ) : (
        <p className="text-sm text-muted">Institutional ownership data is not available for this symbol.</p>
      )}

      {history.length > 1 ? (
        <section className="mt-10">
          <h2 className="mb-3 text-lg font-semibold text-header">Ownership Trend</h2>
          <HistoryBars
            items={[...history].reverse().map((item) => ({
              label: `Q${item.quarter} ${String(item.year).slice(2)}`,
              value: item.row.ownershipPercent,
            }))}
            formatValue={(value) => `${value.toFixed(1)}%`}
          />
          <div className="mt-4 overflow-x-auto rounded-lg border border-border">
            <table className="sa-table">
              <thead>
                <tr>
                  <th>Period</th>
                  <th className="num">Ownership</th>
                  <th className="num">Institutions</th>
                  <th className="num">Invested</th>
                  <th className="num">Increased</th>
                  <th className="num">Reduced</th>
                </tr>
              </thead>
              <tbody>
                {history.map((item) => (
                  <tr key={`${item.year}-${item.quarter}`}>
                    <td>
                      Q{item.quarter} {item.year}
                    </td>
                    <td className="num">{formatPercentPlain(item.row.ownershipPercent, { alreadyPercent: true })}</td>
                    <td className="num">{formatInteger(item.row.investorsHolding)}</td>
                    <td className="num">{formatCompactUsd(item.row.totalInvested)}</td>
                    <td className="num">{formatInteger(item.row.increasedPositions)}</td>
                    <td className="num">{formatInteger(item.row.reducedPositions)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      <section className="mt-10">
        <h2 className="mb-3 text-lg font-semibold text-header">Institutional Holders</h2>
        <p className="mb-3 text-sm text-muted">
          13F positions for Q{quarter} {year}, in the order Financial Modeling Prep returns them.
        </p>
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="sa-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Holder</th>
                <th className="num">Shares</th>
                <th className="num">Change</th>
                <th className="num">Value</th>
                <th className="num">% Out</th>
                <th>Filed</th>
              </tr>
            </thead>
            <tbody>
              {shownHolders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-muted">
                    No 13F holder details for this period.
                  </td>
                </tr>
              ) : (
                shownHolders.map((row, index) => (
                  <tr key={`${row.cik}-${row.investorName}-${holdersPage.from + index}`}>
                    <td className="text-muted">{holdersPage.from + index}</td>
                    <td className="max-w-[280px] truncate font-medium">
                      {row.cik ? (
                        <Link href={institutionalHref(row.cik)} className="text-link hover:underline">
                          {row.investorName}
                        </Link>
                      ) : (
                        row.investorName
                      )}
                      {row.isNew ? <span className="ml-2 text-xs font-normal text-gain">New</span> : null}
                    </td>
                    <td className="num">{formatInteger(row.sharesNumber)}</td>
                    <td className="num">
                      <ChangePercent value={row.changeInSharesNumberPercentage} alreadyPercent />
                    </td>
                    <td className="num">{formatCompactUsd(row.marketValue)}</td>
                    <td className="num">{formatPercentPlain(row.ownership, { alreadyPercent: true })}</td>
                    <td>{formatDate(row.filingDate)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <TablePager
          from={shownHolders.length ? holdersPage.from : 0}
          to={holderTo}
          total={holdersPage.total}
          page={holdersPage.page}
          pageCount={holdersPage.pageCount}
          {...holderLinks}
        />
      </section>

      <section className="mt-10">
        <h2 className="mb-3 text-lg font-semibold text-header">Fund & ETF Holders</h2>
        <p className="mb-3 text-sm text-muted">
          Latest mutual-fund and ETF disclosures that list {ticker}, unique by registrant. Weight is the position as a
          share of that fund, not of shares outstanding.
        </p>
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="sa-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Fund</th>
                <th className="num">Shares</th>
                <th className="num">Change</th>
                <th className="num">Weight</th>
                <th>Reported</th>
              </tr>
            </thead>
            <tbody>
              {fundHolders.rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-muted">
                    No fund or ETF disclosure holders for this symbol.
                  </td>
                </tr>
              ) : (
                fundHolders.rows.map((row, index) => (
                  <tr key={`${row.cik}-${row.holder}-${fundHolders.from + index}`}>
                    <td className="text-muted">{fundHolders.from + index}</td>
                    <td className="max-w-[320px] truncate font-medium">
                      {row.cik ? (
                        <Link href={institutionalHref(row.cik)} className="text-link hover:underline">
                          {row.holder}
                        </Link>
                      ) : (
                        row.holder
                      )}
                    </td>
                    <td className="num">{formatInteger(row.shares)}</td>
                    <td className="num">
                      {row.change ? (
                        <span className={row.change > 0 ? "text-gain" : "text-loss"}>
                          {row.change > 0 ? "+" : ""}
                          {formatInteger(row.change)}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="num">
                      {formatPercentPlain(disclosureWeightPercent(row.weightPercent), { alreadyPercent: true })}
                    </td>
                    <td>{formatDate(row.dateReported)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <TablePager
          from={fundHolders.from}
          to={fundHolders.to}
          total={fundHolders.total}
          page={fundHolders.page}
          pageCount={fundHolders.pageCount}
          {...fundLinks}
        />
      </section>

      <section className="mt-10">
        <h2 className="mb-3 text-lg font-semibold text-header">Beneficial Owners (13G / 13D)</h2>
        <p className="mb-3 text-sm text-muted">
          Latest acquisition-of-beneficial-ownership filings from FMP, unique by reporting person. The CIK on these rows
          is the issuer, not the holder, so names are not linked to 13F portfolios.
        </p>
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="sa-table">
            <thead>
              <tr>
                <th>Reporting person</th>
                <th>Type</th>
                <th className="num">Shares</th>
                <th className="num">% Class</th>
                <th>Filed</th>
                <th>Filing</th>
              </tr>
            </thead>
            <tbody>
              {owners.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-muted">
                    No recent 13G/13D beneficial-owner filings for this symbol.
                  </td>
                </tr>
              ) : (
                owners.map((row) => (
                  <tr key={`${row.nameOfReportingPerson}-${row.filingDate}`}>
                    <td className="max-w-[280px] truncate font-medium">{row.nameOfReportingPerson}</td>
                    <td className="text-muted">{reportingPersonType(row.typeOfReportingPerson)}</td>
                    <td className="num">{formatInteger(parseBeneficialShares(row.amountBeneficiallyOwned))}</td>
                    <td className="num">
                      {formatPercentPlain(parseBeneficialPercent(row.percentOfClass), { alreadyPercent: true })}
                    </td>
                    <td>{formatDate(row.filingDate)}</td>
                    <td>
                      {row.url ? (
                        <a href={row.url} className="text-link hover:underline" target="_blank" rel="noreferrer">
                          SEC
                        </a>
                      ) : (
                        "—"
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </Container>
  );
}
