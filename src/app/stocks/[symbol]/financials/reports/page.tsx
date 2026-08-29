import Link from "next/link";
import { Container } from "@/components/container";
import { FinancialsNav } from "@/components/financials-nav";
import { PageHeader } from "@/components/page-header";
import { getFinancialReportDates } from "@/lib/fmp";
import { decodeTicker, stockPath } from "@/lib/listings";
import { sortReportDates } from "@/lib/financial-reports";

export default async function FinancialReportsPage({ params }: { params: Promise<{ symbol: string }> }) {
  const { symbol } = await params;
  const ticker = decodeTicker(symbol);
  const rows = sortReportDates(await getFinancialReportDates(ticker));
  const base = stockPath(ticker, "/financials/reports");

  return (
    <Container>
      <PageHeader
        title={`${ticker} Financial Reports`}
        description="SEC financial-report packages from FMP, with JSON views that do not expose API credentials."
      />
      <FinancialsNav symbol={ticker} />
      <p className="mb-4 text-sm text-muted">
        These are the company&apos;s as-filed report packages (10-K / 10-Q), not the standardized statements.{" "}
        <Link href={stockPath(ticker, "/financials/income-statement?source=reported")} className="text-link hover:underline">
          Open as-reported income
        </Link>
        .
      </p>
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="sa-table">
          <thead>
            <tr>
              <th>Fiscal Year</th>
              <th>Period</th>
              <th>JSON</th>
              <th>Spreadsheet</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={4} className="text-muted">
                  No financial report packages available.
                </td>
              </tr>
            ) : (
              rows.map((row) => {
                const year = String(row.fiscalYear);
                const period = String(row.period).toUpperCase();
                const href = `${base}/${year}/${period}`;
                const xlsx = `/api/financial-reports/xlsx?symbol=${encodeURIComponent(ticker)}&year=${encodeURIComponent(year)}&period=${encodeURIComponent(period)}`;
                return (
                  <tr key={`${year}-${period}`}>
                    <td>{year}</td>
                    <td>{period}</td>
                    <td>
                      <Link href={href} className="text-link hover:underline">
                        View report
                      </Link>
                    </td>
                    <td>
                      <a href={xlsx} className="text-link hover:underline">
                        Download XLSX
                      </a>
                    </td>
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
