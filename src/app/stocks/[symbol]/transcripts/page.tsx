import Link from "next/link";
import { Container } from "@/components/container";
import { PageHeader } from "@/components/page-header";
import { formatDate } from "@/lib/format";
import { getTranscript, getTranscriptDates } from "@/lib/fmp";

export default async function StockTranscriptsPage({
  params,
  searchParams,
}: {
  params: Promise<{ symbol: string }>;
  searchParams: Promise<{ year?: string; quarter?: string }>;
}) {
  const { symbol } = await params;
  const query = await searchParams;
  const ticker = symbol.toUpperCase();
  const dates = await getTranscriptDates(ticker);
  const latest = dates[0];
  const year = Number(query.year) || latest?.fiscalYear;
  const quarter = Number(query.quarter) || latest?.quarter;
  const transcript = year && quarter ? await getTranscript(ticker, year, quarter) : null;
  const content = transcript?.content?.trim() ?? "";

  return (
    <Container>
      <PageHeader
        title={`${ticker} Earnings Transcripts`}
        description="Full earnings call transcripts from Financial Modeling Prep."
      />
      {dates.length === 0 ? (
        <p className="text-sm text-muted">No transcripts available for {ticker}.</p>
      ) : (
        <>
          <div className="mb-5 flex flex-wrap gap-2">
            {dates.slice(0, 12).map((row) => {
              const href = `/stocks/${ticker}/transcripts?year=${row.fiscalYear}&quarter=${row.quarter}`;
              const active = row.fiscalYear === year && row.quarter === quarter;
              return (
                <Link
                  key={`${row.fiscalYear}-${row.quarter}`}
                  href={href}
                  className={
                    active
                      ? "rounded-full bg-header px-3 py-1 text-sm font-medium text-white"
                      : "rounded-full bg-chip px-3 py-1 text-sm font-medium text-header hover:bg-border"
                  }
                >
                  FY{row.fiscalYear} Q{row.quarter}
                </Link>
              );
            })}
          </div>
          {transcript ? (
            <article className="rounded-lg border border-border p-5">
              <h2 className="text-lg font-semibold text-header">
                {ticker} {transcript.period} {transcript.year}
              </h2>
              <p className="mt-1 text-sm text-muted">{formatDate(transcript.date)}</p>
              <div className="mt-4 max-w-4xl space-y-3 text-sm leading-7 whitespace-pre-wrap">
                {content || "Transcript text is unavailable for this period."}
              </div>
            </article>
          ) : (
            <p className="text-sm text-muted">Select a quarter to load the transcript.</p>
          )}
        </>
      )}
    </Container>
  );
}
