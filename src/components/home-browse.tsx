import Link from "next/link";

const MARKET_LINKS = [
  ["/markets/premarket", "Pre-Market"],
  ["/markets/afterhours", "After Hours"],
  ["/markets/hours", "Hours"],
  ["/markets/indexes", "Indexes"],
  ["/markets/heatmap", "Heatmap"],
  ["/markets/global", "World Markets"],
  ["/stocks/country", "Countries"],
  ["/markets/sectors", "Sectors"],
  ["/markets/industries", "Industries"],
  ["/markets/treasury", "Treasury"],
] as const;

const LIST_LINKS = [
  ["/list/magnificent-seven", "Mag 7"],
  ["/list/faang", "FAANG"],
  ["/list/ai-stocks", "AI"],
  ["/list/clean-energy", "Clean Energy"],
  ["/list/spac-stocks", "SPACs"],
  ["/list/ev-stocks", "EVs"],
  ["/list/glp1-stocks", "GLP-1"],
  ["/list/apparel-stocks", "Apparel"],
  ["/list/bdc-stocks", "BDCs"],
  ["/list/top-rated", "Top Rated"],
  ["/list/top-rated-dividend-stocks", "Top-Rated Dividends"],
  ["/list/bitcoin-etfs", "Bitcoin ETFs"],
  ["/list/highest-revenue", "Revenue"],
  ["/list/dividend-aristocrats", "Aristocrats"],
  ["/list/reit-stocks", "REITs"],
  ["/list/52-week-high", "52-Week High"],
] as const;

function ChipRow({
  title,
  href,
  links,
}: {
  title: string;
  href: string;
  links: readonly (readonly [string, string])[];
}) {
  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <h2 className="text-sm font-semibold text-header">{title}</h2>
        <Link href={href} className="text-xs font-medium text-link hover:underline">
          See all
        </Link>
      </div>
      <div className="sa-scroll sa-scroll-hide flex gap-2 pb-1">
        {links.map(([itemHref, label]) => (
          <Link
            key={itemHref}
            href={itemHref}
            className="shrink-0 rounded-full border border-border bg-background px-3 py-1.5 text-sm font-medium text-header transition-colors hover:border-border-strong hover:bg-muted-bg"
          >
            {label}
          </Link>
        ))}
      </div>
    </div>
  );
}

export function HomeBrowse() {
  return (
    <nav className="mb-8 grid gap-5" aria-label="Browse markets and lists">
      <ChipRow title="Markets" href="/markets" links={MARKET_LINKS} />
      <ChipRow title="Stock lists" href="/list" links={LIST_LINKS} />
    </nav>
  );
}
