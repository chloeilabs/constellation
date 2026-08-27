import { notFound } from "next/navigation";
import Link from "next/link";
import { Container } from "@/components/container";
import { PageHeader } from "@/components/page-header";
import { SymbolTable } from "@/components/symbol-table";
import { decodeTicker, stockPath } from "@/lib/listings";
import { indexConstituentMeta, indexDisplayName, isIndexTicker } from "@/lib/indexes";
import { loadIndexMembers } from "@/lib/lists";

export async function generateMetadata({ params }: { params: Promise<{ symbol: string }> }) {
  const ticker = decodeTicker((await params).symbol);
  const meta = indexConstituentMeta(ticker);
  const name = meta?.label ?? indexDisplayName(ticker);
  return {
    title: `${name} Constituents`,
    description: `Companies in the ${name}, ranked by market capitalization from live FMP quotes.`,
  };
}

export default async function IndexConstituentsPage({ params }: { params: Promise<{ symbol: string }> }) {
  const ticker = decodeTicker((await params).symbol);
  if (!isIndexTicker(ticker)) notFound();
  const meta = indexConstituentMeta(ticker);
  if (!meta) notFound();
  const { rows } = await loadIndexMembers(meta.fmpIndex);

  return (
    <Container>
      <PageHeader
        title={`${meta.label} Constituents`}
        description={`${rows.length} companies currently in the ${meta.label}, ranked by market cap from live FMP quotes.`}
        actions={
          <Link href={`/list/${meta.listSlug}`} className="text-sm text-link hover:underline">
            Open the {meta.label} list
          </Link>
        }
      />
      <p className="mb-3 text-sm text-muted">
        <Link href={stockPath(ticker)} className="text-link hover:underline">
          {ticker} overview
        </Link>
      </p>
      <SymbolTable rows={rows} empty="Constituent quotes are unavailable." />
    </Container>
  );
}
