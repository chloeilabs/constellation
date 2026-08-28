import Link from "next/link";
import { Container } from "@/components/container";
import { PageHeader } from "@/components/page-header";
import { SectionNav } from "@/components/section-nav";
import { CALENDAR_NAV, IPO_NAV } from "@/lib/nav";
import { formatCompact, formatCompactUsd, formatDate, formatPrice } from "@/lib/format";
import { getIpoDisclosures, getIpoProspectuses, getIpos } from "@/lib/fmp";
import { quoteHref } from "@/lib/listings";
import { addDays, isoDate, nyDateString } from "@/lib/utils";
import type { FmpIpo } from "@/lib/types";

const REGISTRATION_FORMS = /^(S-1|S-1\/A|F-1|F-1\/A)$/i;

function mondayIso(dateStr: string) {
  const day = dateStr.slice(0, 10);
  const date = new Date(`${day}T00:00:00`);
  if (Number.isNaN(date.getTime())) return day;
  const weekday = date.getDay();
  date.setDate(date.getDate() + (weekday === 0 ? -6 : 1 - weekday));
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const dateNum = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${dateNum}`;
}

function groupIposByWeek(rows: FmpIpo[]) {
  const sorted = [...rows].sort(
    (a, b) => a.date.localeCompare(b.date) || (a.symbol || "").localeCompare(b.symbol || ""),
  );
  const groups: { weekStart: string; rows: FmpIpo[] }[] = [];
  for (const row of sorted) {
    const weekStart = mondayIso(row.date);
    const last = groups.at(-1);
    if (last && last.weekStart === weekStart) last.rows.push(row);
    else groups.push({ weekStart, rows: [row] });
  }
  return groups;
}

export default async function IpoCalendarPage() {
  const today = new Date(`${nyDateString()}T00:00:00Z`);
  const calendarFrom = isoDate(addDays(today, -45));
  const calendarTo = isoDate(addDays(today, 45));
  const filingFrom = isoDate(addDays(today, -21));
  const filingTo = isoDate(today);
  const [rows, disclosures, prospectuses] = await Promise.all([
    getIpos(calendarFrom, calendarTo),
    getIpoDisclosures(filingFrom, filingTo),
    getIpoProspectuses(calendarFrom, calendarTo),
  ]);
  const registrations = disclosures
    .filter((row) => REGISTRATION_FORMS.test(row.form))
    .slice(0, 40);
  const offerings = prospectuses.slice(0, 40);
  const weeks = groupIposByWeek(rows);

  return (
    <Container>
      <PageHeader
        title="IPO Calendar"
        description="Recent and upcoming initial public offerings, plus S-1 filings and prospectuses."
      />
      <SectionNav items={CALENDAR_NAV} />
      <SectionNav items={IPO_NAV} />
      {weeks.length === 0 ? (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="sa-table">
            <tbody>
              <tr>
                <td className="text-muted">No IPOs in this window.</td>
              </tr>
            </tbody>
          </table>
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          {weeks.map((week) => (
            <section key={week.weekStart}>
              <h2 className="mb-3 text-lg font-semibold text-header">
                Week of {formatDate(week.weekStart)}
              </h2>
              <div className="overflow-x-auto rounded-lg border border-border">
                <table className="sa-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Symbol</th>
                      <th>Company</th>
                      <th>Exchange</th>
                      <th>Price Range</th>
                      <th className="num">Shares</th>
                      <th>Status</th>
                      <th className="num">Market Cap</th>
                    </tr>
                  </thead>
                  <tbody>
                    {week.rows.map((row) => (
                      <tr key={`${row.symbol}-${row.date}-${row.company}`}>
                        <td>{formatDate(row.date)}</td>
                        <td className="symbol">
                          {row.symbol ? (
                            <Link href={quoteHref(row.symbol)} className="text-link hover:underline">
                              {row.symbol}
                            </Link>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td>{row.company || "—"}</td>
                        <td>{row.exchange || "—"}</td>
                        <td>{row.priceRange || "—"}</td>
                        <td className="num">{row.shares != null ? formatCompact(row.shares) : "—"}</td>
                        <td>{row.actions || "—"}</td>
                        <td className="num">{formatCompactUsd(row.marketCap)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          ))}
        </div>
      )}

      <section className="mt-10">
        <h2 className="mb-3 text-lg font-semibold text-header">IPO Prospectuses</h2>
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="sa-table">
            <thead>
              <tr>
                <th>Filed</th>
                <th>Symbol</th>
                <th>Form</th>
                <th className="num">Price</th>
                <th className="num">Proceeds</th>
                <th>Document</th>
              </tr>
            </thead>
            <tbody>
              {offerings.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-muted">
                    No prospectuses in this window.
                  </td>
                </tr>
              ) : (
                offerings.map((row) => (
                  <tr key={`${row.symbol}-${row.filingDate}-${row.form}`}>
                    <td>{formatDate(row.filingDate || row.acceptedDate)}</td>
                    <td className="symbol">
                      {row.symbol ? (
                        <Link href={quoteHref(row.symbol)} className="text-link hover:underline">
                          {row.symbol}
                        </Link>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td>{row.form}</td>
                    <td className="num">{row.pricePublicPerShare != null ? `$${formatPrice(row.pricePublicPerShare)}` : "—"}</td>
                    <td className="num">{formatCompactUsd(row.proceedsBeforeExpensesTotal)}</td>
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

      {registrations.length > 0 ? (
      <section className="mt-10">
        <h2 className="mb-3 text-lg font-semibold text-header">Registration Statements</h2>
        <p className="mb-3 text-sm text-muted">S-1 and F-1 filings from the last three weeks.</p>
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="sa-table">
            <thead>
              <tr>
                <th>Filed</th>
                <th>Symbol</th>
                <th>Form</th>
                <th>Effective</th>
                <th>Document</th>
              </tr>
            </thead>
            <tbody>
              {registrations.map((row) => (
                  <tr key={`${row.symbol}-${row.filingDate}-${row.form}-${row.cik}`}>
                    <td>{formatDate(row.filingDate)}</td>
                    <td className="symbol">
                      {row.symbol ? (
                        <Link href={quoteHref(row.symbol)} className="text-link hover:underline">
                          {row.symbol}
                        </Link>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td>{row.form}</td>
                    <td>{formatDate(row.effectivenessDate)}</td>
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
              ))}
            </tbody>
          </table>
        </div>
      </section>
      ) : null}
    </Container>
  );
}
