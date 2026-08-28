import Link from "next/link";
import { Container } from "@/components/container";
import { PageHeader } from "@/components/page-header";
import { SectionNav } from "@/components/section-nav";
import { NEWS_NAV } from "@/lib/nav";
import { formatDate, formatPrice } from "@/lib/format";
import { getGradesLatestNews } from "@/lib/fmp";
import { gradeActionKind, gradeActionLabel } from "@/lib/grades";
import { isForeignListingSymbol } from "@/lib/listings";
import { cn } from "@/lib/utils";

export const metadata = {
  title: "Analyst Ratings",
  description: "Latest analyst upgrades, downgrades, and initiations from FMP grade news.",
};

const VIEWS = [
  { id: "all", label: "All", href: "/analysts" },
  { id: "upgrades", label: "Upgrades", href: "/analysts?view=upgrades" },
  { id: "downgrades", label: "Downgrades", href: "/analysts?view=downgrades" },
  { id: "initiations", label: "Initiations", href: "/analysts?view=initiations" },
  { id: "maintains", label: "Maintains", href: "/analysts?view=maintains" },
] as const;

type AnalystView = (typeof VIEWS)[number]["id"];

export default async function AnalystsPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  const { view: viewParam } = await searchParams;
  const view: AnalystView = VIEWS.some((item) => item.id === viewParam) ? (viewParam as AnalystView) : "all";
  const raw = await getGradesLatestNews(80);
  const seen = new Set<string>();
  const rows = raw.filter((row) => {
    if (!row.symbol || isForeignListingSymbol(row.symbol)) return false;
    const key = `${row.symbol}|${row.publishedDate}|${row.gradingCompany}|${row.action}`;
    if (seen.has(key)) return false;
    seen.add(key);
    if (view !== "all" && gradeActionKind(row.action) !== view) return false;
    return true;
  });

  return (
    <Container>
      <PageHeader
        title="Analyst Ratings"
        description="Recent upgrades, downgrades, and initiations from sell-side research, via FMP grade news."
      />
      <SectionNav items={NEWS_NAV} />
      <div className="mb-5 flex flex-wrap gap-2">
        {VIEWS.map((item) => (
          <Link
            key={item.id}
            href={item.href}
            className={cn(
              "rounded-full px-3 py-1 text-sm font-medium",
              item.id === view ? "bg-header text-on-header" : "bg-chip text-header hover:bg-border",
            )}
          >
            {item.label}
          </Link>
        ))}
      </div>
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
                    <Link href={`/stocks/${row.symbol}/ratings`} className="text-link hover:underline">
                      {row.symbol}
                    </Link>
                  </td>
                  <td className="max-w-[160px] truncate">{row.gradingCompany || "—"}</td>
                  <td>{gradeActionLabel(row.action)}</td>
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
