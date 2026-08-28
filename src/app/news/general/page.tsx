import { Container } from "@/components/container";
import { NewsWindowPager } from "@/components/news-window-pager";
import { PageHeader } from "@/components/page-header";
import { SectionNav } from "@/components/section-nav";
import { NEWS_NAV } from "@/lib/nav";
import { getGeneralNews } from "@/lib/fmp";
import { NEWS_PAGE_SIZE, pageNumber } from "@/lib/paging";

export default async function GeneralNewsPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const { page: pageParam } = await searchParams;
  const page = pageNumber(pageParam);
  const items = await getGeneralNews(NEWS_PAGE_SIZE, page - 1);
  return (
    <Container>
      <PageHeader
        title="General Market News"
        description="Broader market, economy, and company headlines beyond single-stock stories."
      />
      <SectionNav items={NEWS_NAV} />
      <NewsWindowPager items={items} page={page} pageSize={NEWS_PAGE_SIZE} path="/news/general" />
    </Container>
  );
}
