import Link from "next/link";
import { Container } from "@/components/container";
import { PageHeader } from "@/components/page-header";
import { SectionNav } from "@/components/section-nav";
import { TablePager } from "@/components/table-pager";
import { NEWS_NAV } from "@/lib/nav";
import { formatDate } from "@/lib/format";
import { getLatestTranscriptsArchive } from "@/lib/fmp";
import { isForeignListingSymbol } from "@/lib/listings";
import { TABLE_PAGE_SIZE, pageNumber, paginate, pagerLinks } from "@/lib/paging";

export const metadata = {
  title: "Earnings Transcripts",
  description: "Latest earnings call transcripts from Financial Modeling Prep.",
};

export default async function TranscriptsHubPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageParam } = await searchParams;
  const raw = await getLatestTranscriptsArchive();
  const rows = raw.filter((row) => row.symbol && !isForeignListingSymbol(row.symbol));
  const feed = paginate(rows, pageNumber(pageParam), TABLE_PAGE_SIZE);

  return (
    <Container>
      <PageHeader
        title="Earnings Transcripts"
        description="Recently published earnings call transcripts, linked to the full text on each quote."
      />
      <SectionNav items={NEWS_NAV} />
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="sa-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Symbol</th>
              <th>Period</th>
              <th>Transcript</th>
            </tr>
          </thead>
          <tbody>
            {feed.rows.length === 0 ? (
              <tr>
                <td colSpan={4} className="text-muted">
                  No recent transcripts.
                </td>
              </tr>
            ) : (
              feed.rows.map((row) => {
                const quarter = row.quarter ?? (Number(String(row.period || "").replace(/\D/g, "")) || 1);
                const href = `/stocks/${row.symbol}/transcripts?year=${row.fiscalYear}&quarter=${quarter}`;
                return (
                  <tr key={`${row.symbol}-${row.fiscalYear}-${row.period}-${row.date}`}>
                    <td>{formatDate(row.date)}</td>
                    <td className="symbol">
                      <Link href={`/stocks/${row.symbol}`} className="text-link hover:underline">
                        {row.symbol}
                      </Link>
                    </td>
                    <td>
                      {row.period || `Q${quarter}`} {row.fiscalYear}
                    </td>
                    <td>
                      <Link href={href} className="text-link hover:underline">
                        Read transcript
                      </Link>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      <TablePager
        from={feed.from}
        to={feed.to}
        total={feed.total}
        page={feed.page}
        pageCount={feed.pageCount}
        {...pagerLinks("/news/transcripts", feed.page, feed.pageCount)}
      />
    </Container>
  );
}
