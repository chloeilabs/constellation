import Link from "next/link";
import { Container } from "@/components/container";
import { PageHeader } from "@/components/page-header";
import { SectionNav } from "@/components/section-nav";
import { formatDate } from "@/lib/format";
import { getProfile, getTranscript, getTranscriptDates } from "@/lib/fmp";
import { decodeTicker, displayCompanyName, stockPath } from "@/lib/listings";
import { quoteNewsNav } from "@/lib/nav";
import { parseTranscript } from "@/lib/transcripts";
import { cn } from "@/lib/utils";

export default async function StockTranscriptsPage({
  params,
  searchParams,
}: {
  params: Promise<{ symbol: string }>;
  searchParams: Promise<{ year?: string; quarter?: string }>;
}) {
  const { symbol } = await params;
  const query = await searchParams;
  const ticker = decodeTicker(symbol);
  const [dates, profile] = await Promise.all([getTranscriptDates(ticker), getProfile(ticker)]);
  const latest = dates[0];
  const year = Number(query.year) || latest?.fiscalYear;
  const quarter = Number(query.quarter) || latest?.quarter;
  const transcript = year && quarter ? await getTranscript(ticker, year, quarter) : null;
  const content = transcript?.content?.trim() ?? "";
  const turns = parseTranscript(content);
  const shortName = displayCompanyName(profile?.companyName) || ticker;
  const byYear = new Map<number, typeof dates>();
  for (const row of dates) {
    const list = byYear.get(row.fiscalYear) ?? [];
    list.push(row);
    byYear.set(row.fiscalYear, list);
  }
  const years = [...byYear.keys()].sort((a, b) => b - a);

  return (
    <Container>
      <PageHeader
        title={`${shortName} Earnings Call Transcripts`}
        description="Full earnings call transcripts from Financial Modeling Prep, grouped by fiscal year and split by speaker."
      />
      <SectionNav items={quoteNewsNav(ticker)} />
      {dates.length === 0 ? (
        <p className="text-sm text-muted">No transcripts available for {ticker}.</p>
      ) : (
        <>
          <div className="mb-8 flex flex-col gap-6">
            {years.map((fiscalYear) => {
              const rows = [...(byYear.get(fiscalYear) ?? [])].sort((a, b) => b.quarter - a.quarter);
              return (
                <section key={fiscalYear}>
                  <h2 className="mb-2 text-lg font-semibold text-header">FY{fiscalYear}</h2>
                  <div className="flex flex-wrap gap-2">
                    {rows.map((row) => {
                      const href = `${stockPath(ticker, "/transcripts")}?year=${row.fiscalYear}&quarter=${row.quarter}`;
                      const active = row.fiscalYear === year && row.quarter === quarter;
                      return (
                        <Link
                          key={`${row.fiscalYear}-${row.quarter}`}
                          href={href}
                          scroll={false}
                          className={cn(
                            "rounded-full px-3 py-1 text-sm font-medium",
                            active
                              ? "bg-brand text-white"
                              : "bg-chip text-header hover:bg-border",
                          )}
                        >
                          Q{row.quarter}
                        </Link>
                      );
                    })}
                  </div>
                </section>
              );
            })}
          </div>
          {transcript ? (
            <article className="rounded-lg border border-border p-5">
              <h2 className="text-lg font-semibold text-header">
                {shortName} {transcript.period} {transcript.year}
              </h2>
              <p className="mt-1 text-sm text-muted">{formatDate(transcript.date)}</p>
              {turns.length ? (
                <div className="mt-4 flex max-w-4xl flex-col gap-5">
                  {turns.map((turn, index) => (
                    <section key={`${turn.speaker}-${index}`}>
                      {turn.speaker ? (
                        <h3 className="text-sm font-semibold text-header">{turn.speaker}</h3>
                      ) : null}
                      <p className="mt-1 whitespace-pre-wrap text-sm leading-7 text-header/90">{turn.text}</p>
                    </section>
                  ))}
                </div>
              ) : (
                <p className="mt-4 text-sm text-muted">Transcript text is unavailable for this period.</p>
              )}
            </article>
          ) : (
            <p className="text-sm text-muted">Select a quarter to load the transcript.</p>
          )}
        </>
      )}
    </Container>
  );
}
