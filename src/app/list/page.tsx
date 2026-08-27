import Link from "next/link";
import { Container } from "@/components/container";
import { PageHeader } from "@/components/page-header";
import { STOCK_LISTS } from "@/lib/lists";

export default function ListsIndexPage() {
  return (
    <Container>
      <PageHeader
        title="Stock Lists"
        description="Curated lists of U.S. stocks by market cap and exchange."
      />
      <div className="grid gap-4 md:grid-cols-3">
        {Object.entries(STOCK_LISTS).map(([slug, list]) => (
          <Link
            key={slug}
            href={`/list/${slug}`}
            className="rounded-lg border border-border p-5 hover:border-border-strong hover:bg-muted-bg"
          >
            <h2 className="font-semibold text-header">{list.title}</h2>
            <p className="mt-2 text-sm text-muted">{list.description}</p>
          </Link>
        ))}
        <Link
          href="/etf"
          className="rounded-lg border border-border p-5 hover:border-border-strong hover:bg-muted-bg"
        >
          <h2 className="font-semibold text-header">Largest ETFs</h2>
          <p className="mt-2 text-sm text-muted">Exchange-traded funds ranked by assets under management.</p>
        </Link>
      </div>
    </Container>
  );
}
