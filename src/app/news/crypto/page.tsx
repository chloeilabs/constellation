import { Container } from "@/components/container";
import { NewsWindowPager } from "@/components/news-window-pager";
import { PageHeader } from "@/components/page-header";
import { SectionNav } from "@/components/section-nav";
import { NEWS_NAV } from "@/lib/nav";
import { getCryptoNewsLatest } from "@/lib/fmp";
import { NEWS_PAGE_SIZE, pageNumber } from "@/lib/paging";

export const metadata = {
  title: "Cryptocurrency News",
  description: "Latest crypto headlines from Financial Modeling Prep.",
};

export default async function CryptoNewsPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const { page: pageParam } = await searchParams;
  const page = pageNumber(pageParam);
  const items = await getCryptoNewsLatest(NEWS_PAGE_SIZE, page - 1);
  return (
    <Container>
      <PageHeader
        title="Cryptocurrency News"
        description="Latest Bitcoin, Ethereum, and digital-asset headlines."
      />
      <SectionNav items={NEWS_NAV} />
      <NewsWindowPager items={items} page={page} pageSize={NEWS_PAGE_SIZE} path="/news/crypto" />
    </Container>
  );
}
