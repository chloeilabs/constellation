import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/container";
import { FinancialsNav } from "@/components/financials-nav";
import { PageHeader } from "@/components/page-header";
import { getFinancialReportJson } from "@/lib/fmp";
import { formatNumber, formatPrice } from "@/lib/format";
import { isReportPeriod, isReportYear, parseFinancialReport, statementSections } from "@/lib/financial-reports";
import { decodeTicker, stockPath } from "@/lib/listings";
import { cn } from "@/lib/utils";

function formatReportCell(value: unknown) {
  if (value == null || value === "") return "—";
  if (typeof value === "number") {
    if (!Number.isFinite(value)) return "—";
    return Number.isInteger(value) ? formatNumber(value) : formatPrice(value);
  }
  return String(value);
}

export default async function FinancialReportDetailPage({
  params,
}: {
  params: Promise<{ symbol: string; year: string; period: string }>;
}) {
  const { symbol, year, period } = await params;
  const ticker = decodeTicker(symbol);
  const fiscalYear = year;
  const reportPeriod = period.toUpperCase();
  if (!isReportYear(fiscalYear) || !isReportPeriod(reportPeriod)) notFound();

  const report = await getFinancialReportJson(ticker, fiscalYear, reportPeriod);
  if (!report) notFound();
  const sections = parseFinancialReport(report);
  const featured = statementSections(sections);
  const rest = sections.filter((section) => !featured.some((item) => item.id === section.id));
  const xlsx = `/api/financial-reports/xlsx?symbol=${encodeURIComponent(ticker)}&year=${encodeURIComponent(fiscalYear)}&period=${encodeURIComponent(reportPeriod)}`;
  const listHref = stockPath(ticker, "/financials/reports");

  return (
    <Container>
      <PageHeader
        title={`${ticker} ${reportPeriod} ${fiscalYear} Report`}
        description="As-filed financial report JSON from FMP, rendered without exposing API credentials."
        actions={
          <div className="flex flex-wrap gap-2 text-sm">
            <Link href={listHref} className="rounded-md border border-border px-3 py-1.5 font-medium hover:bg-muted-bg">
              All reports
            </Link>
            <a href={xlsx} className="rounded-md border border-border px-3 py-1.5 font-medium hover:bg-muted-bg">
              Download XLSX
            </a>
          </div>
        }
      />
      <FinancialsNav symbol={ticker} />
      {sections.length === 0 ? (
        <p className="text-sm text-muted">This report package did not include tabular sections.</p>
      ) : (
        <>
          {featured.map((section) => (
            <ReportSectionTable key={section.id} section={section} />
          ))}
          {rest.length > 0 ? (
            <details className="mt-10">
              <summary className="cursor-pointer text-sm font-medium text-header">
                Additional report notes ({rest.length})
              </summary>
              {rest.map((section) => (
                <ReportSectionTable key={section.id} section={section} />
              ))}
            </details>
          ) : null}
        </>
      )}
    </Container>
  );
}

function ReportSectionTable({
  section,
}: {
  section: ReturnType<typeof parseFinancialReport>[number];
}) {
  const colCount = Math.max(section.columns.length, ...section.rows.map((row) => row.values.length), 1);
  const columns = section.columns.length
    ? section.columns
    : Array.from({ length: colCount }, (_, index) => `Col ${index + 1}`);

  return (
    <section className="mt-10">
      <h2 className="mb-1 text-lg font-semibold text-header">{section.title}</h2>
      {section.caption ? <p className="mb-3 text-xs text-muted">{section.caption}</p> : null}
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="sa-table sa-statement">
          <thead>
            <tr>
              <th>Line</th>
              {columns.map((column, index) => (
                <th key={`${column}-${index}`} className="num">
                  {column || "—"}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {section.rows.map((row, index) => (
              <tr key={`${row.label}-${index}`} className={row.section ? "bg-muted-bg/60 font-semibold" : undefined}>
                <td className="whitespace-normal">{row.label}</td>
                {columns.map((_, colIndex) => {
                  const text = formatReportCell(row.values[colIndex]);
                  return (
                    <td key={colIndex} className={cn("num", text === "—" ? "text-muted" : undefined)}>
                      {text}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
