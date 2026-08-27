import Link from "next/link";
import { Container } from "@/components/container";
import { PageHeader } from "@/components/page-header";
import { LIST_CATEGORIES, STOCK_LISTS } from "@/lib/lists";

export default function ListsIndexPage() {
  return (
    <Container>
      <PageHeader
        title="Stock Lists"
        description="Index constituents, U.S. exchanges, market-cap groups, and other ranked stock lists."
      />
      <div className="space-y-10">
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
                    className="rounded-lg border border-border p-5 hover:border-border-strong hover:bg-muted-bg"
                  >
                    <h3 className="font-semibold text-header">{list.title}</h3>
                    <p className="mt-2 text-sm text-muted">{list.description}</p>
                  </Link>
                ))}
                {category.id === "popular" ? (
                  <Link
                    href="/etf"
                    className="rounded-lg border border-border p-5 hover:border-border-strong hover:bg-muted-bg"
                  >
                    <h3 className="font-semibold text-header">Largest ETFs</h3>
                    <p className="mt-2 text-sm text-muted">
                      Exchange-traded funds ranked by assets under management.
                    </p>
                  </Link>
                ) : null}
              </div>
            </section>
          );
        })}
      </div>
    </Container>
  );
}
