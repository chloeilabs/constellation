import Link from "next/link";
import { Container } from "@/components/container";
import { PageHeader } from "@/components/page-header";
import { LIST_CATEGORIES, STOCK_LISTS } from "@/lib/lists";

export default function ListsIndexPage() {
  return (
    <Container>
      <PageHeader
        title="Stock Lists"
        description="Index constituents, U.S. exchanges, market-cap groups, dividend lists, and other ranked stock lists."
      />
      <div className="flex flex-col gap-10">
        {LIST_CATEGORIES.map((category) => {
          const lists = Object.entries(STOCK_LISTS).filter(([, list]) => list.category === category.id);
          return (
            <section key={category.id}>
              <h2 className="mb-4 text-xl font-semibold text-header">{category.title}</h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {lists.map(([slug, list]) => (
                  <Link
                    key={slug}
                    href={`/list/${slug}`}
                    className="sa-card p-5"
                  >
                    <h3 className="font-semibold text-header">{list.title}</h3>
                    <p className="mt-2 text-sm text-muted">{list.description}</p>
                  </Link>
                ))}
                {category.id === "popular" ? (
                  <>
                    <Link
                      href="/stocks/sector"
                      className="sa-card p-5"
                    >
                      <h3 className="font-semibold text-header">Sectors</h3>
                      <p className="mt-2 text-sm text-muted">
                        Technology, healthcare, financials, and the rest of the market, with PE and daily change.
                      </p>
                    </Link>
                    <Link
                      href="/stocks/industry"
                      className="sa-card p-5"
                    >
                      <h3 className="font-semibold text-header">Sectors & Industries</h3>
                      <p className="mt-2 text-sm text-muted">
                        Every industry grouped by sector, with combined market cap and performance.
                      </p>
                    </Link>
                    <Link
                      href="/etf"
                      className="sa-card p-5"
                    >
                      <h3 className="font-semibold text-header">Largest ETFs</h3>
                      <p className="mt-2 text-sm text-muted">
                        Exchange-traded funds ranked by assets under management.
                      </p>
                    </Link>
                    <Link
                      href="/funds"
                      className="sa-card p-5"
                    >
                      <h3 className="font-semibold text-header">Mutual Funds</h3>
                      <p className="mt-2 text-sm text-muted">
                        Actively traded U.S. mutual funds ranked by total assets.
                      </p>
                    </Link>
                  </>
                ) : null}
                {category.id === "international" ? (
                  <>
                    <Link
                      href="/list/exchanges"
                      className="sa-card p-5"
                    >
                      <h3 className="font-semibold text-header">Stock Exchanges</h3>
                      <p className="mt-2 text-sm text-muted">
                        Global venues with ticker suffixes, quote delay, and live open/closed status.
                      </p>
                    </Link>
                    <Link
                      href="/stocks/country"
                      className="sa-card p-5"
                    >
                      <h3 className="font-semibold text-header">All Country Stocks</h3>
                      <p className="mt-2 text-sm text-muted">
                        Korea, Taiwan, Switzerland, and other local exchanges ranked by market cap.
                      </p>
                    </Link>
                  </>
                ) : null}
              </div>
            </section>
          );
        })}
      </div>
    </Container>
  );
}
