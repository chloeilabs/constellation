import Link from "next/link";
import { formatCompactUsd, formatInteger } from "@/lib/format";
import type { FmpExecutive, FmpExecutiveCompensation } from "@/lib/types";

export function CompanyPeople({
  executives,
  compensation = [],
  year = 0,
  compact = false,
  moreHref,
}: {
  executives: FmpExecutive[];
  compensation?: FmpExecutiveCompensation[];
  year?: number;
  compact?: boolean;
  moreHref?: string;
}) {
  return (
    <>
      <section className="mt-10">
        <h2 className="mb-3 text-xl font-semibold text-header">Key Executives</h2>
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="sa-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Position</th>
                {compact ? null : (
                  <>
                    <th className="num">Pay</th>
                    <th className="num">Year Born</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {executives.length === 0 ? (
                <tr>
                  <td colSpan={compact ? 2 : 4} className="text-muted">
                    Executive data is unavailable for this company.
                  </td>
                </tr>
              ) : (
                executives.map((person) => (
                  <tr key={`${person.name}-${person.title}`}>
                    <td className="font-medium">{person.name}</td>
                    <td className="whitespace-normal text-muted">{person.title}</td>
                    {compact ? null : (
                      <>
                        <td className="num">
                          {person.pay != null ? formatCompactUsd(person.pay) : "—"}
                          {person.pay != null && person.currencyPay ? (
                            <span className="ml-1 text-xs text-muted">{person.currencyPay}</span>
                          ) : null}
                        </td>
                        <td className="num">{person.yearBorn ? formatInteger(person.yearBorn) : "—"}</td>
                      </>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {compact && moreHref ? (
          <p className="mt-2 text-sm">
            <Link href={moreHref} className="text-link hover:underline">
              Executive compensation
            </Link>
          </p>
        ) : null}
      </section>

      {!compact && compensation.length > 0 ? (
        <section className="mt-10">
          <h2 className="mb-3 text-xl font-semibold text-header">Executive Compensation ({year})</h2>
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="sa-table">
              <thead>
                <tr>
                  <th>Name / Position</th>
                  <th className="num">Salary</th>
                  <th className="num">Stock</th>
                  <th className="num">Bonus / Incentive</th>
                  <th className="num">Other</th>
                  <th className="num">Total</th>
                </tr>
              </thead>
              <tbody>
                {compensation.map((row) => (
                  <tr key={`${row.nameAndPosition}-${row.year}`}>
                    <td className="max-w-[280px] whitespace-normal font-medium">{row.nameAndPosition}</td>
                    <td className="num">{formatCompactUsd(row.salary)}</td>
                    <td className="num">{formatCompactUsd((row.stockAward || 0) + (row.optionAward || 0))}</td>
                    <td className="num">{formatCompactUsd((row.bonus || 0) + (row.incentivePlanCompensation || 0))}</td>
                    <td className="num">{formatCompactUsd(row.allOtherCompensation)}</td>
                    <td className="num font-semibold">{formatCompactUsd(row.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {compensation[0]?.link ? (
            <p className="mt-2 text-sm text-muted">
              From the{" "}
              <a href={compensation[0].link} className="text-link hover:underline" target="_blank" rel="noreferrer">
                proxy filing
              </a>
              .
            </p>
          ) : null}
        </section>
      ) : null}
    </>
  );
}
