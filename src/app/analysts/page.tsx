import Link from "next/link";
import { Container } from "@/components/container";
import { PageHeader } from "@/components/page-header";
import { SectionNav } from "@/components/section-nav";
import { NEWS_NAV } from "@/lib/nav";
import { formatDate, formatPrice } from "@/lib/format";
import { getGradesLatestNews } from "@/lib/fmp";
import { isForeignListingSymbol } from "@/lib/listings";

function actionLabel(action: string) {
  const value = (action || "").toLowerCase();
  if (value === "initialise" || value === "initialize" || value === "init") return "Initiate";
  if (value === "upgrade") return "Upgrade";
  if (value === "downgrade") return "Downgrade";
  if (value === "hold" || value === "maintain") return "Maintain";
  return action ? action.replace(/^\w/, (char) => char.toUpperCase()) : "—";
}

export const metadata = {
  title: "Analyst Ratings",
  description: "Latest analyst upgrades, downgrades, and initiations from FMP grade news.",
};

export default async function AnalystsPage() {
  const raw = await getGradesLatestNews(80);
  const seen = new Set<string>();
  const rows = raw.filter((row) => {
    if (!row.symbol || isForeignListingSymbol(row.symbol)) return false;
    const key = `${row.symbol}|${row.publishedDate}|${row.gradingCompany}|${row.action}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return (
    <Container>
      <PageHeader
        title="Analyst Ratings"
        description="Recent upgrades, downgrades, and initiations from sell-side research, via FMP grade news."
      />
      <SectionNav items={NEWS_NAV} />
      <p className="mb-3 text-sm text-muted">{rows.length} recent rating actions</p>
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="sa-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Symbol</th>
              <th>Firm</th>
              <th>Action</th>
              <th>From</th>
              <th>To</th>
              <th className="num">Price</th>
              <th>Headline</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-muted">
                  No recent analyst actions.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={`${row.symbol}-${row.publishedDate}-${row.gradingCompany}-${row.action}`}>
                  <td>{formatDate(row.publishedDate)}</td>
                  <td className="symbol">
                    <Link href={`/stocks/${row.symbol}`} className="text-link hover:underline">
                      {row.symbol}
                    </Link>
                  </td>
                  <td className="max-w-[160px] truncate">{row.gradingCompany || "—"}</td>
                  <td>{actionLabel(row.action)}</td>
                  <td>{row.previousGrade || "—"}</td>
                  <td className="font-medium">{row.newGrade || "—"}</td>
                  <td className="num">{formatPrice(row.priceWhenPosted)}</td>
                  <td className="max-w-[360px] truncate">
                    {row.newsURL ? (
                      <a href={row.newsURL} className="text-link hover:underline" target="_blank" rel="noreferrer">
                        {row.newsTitle}
                      </a>
                    ) : (
                      row.newsTitle
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </Container>
  );
}
