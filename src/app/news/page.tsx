import { Container } from "@/components/container";
import { NewsWindowPager } from "@/components/news-window-pager";
import { PageHeader } from "@/components/page-header";
import { SectionNav } from "@/components/section-nav";
import { NEWS_NAV } from "@/lib/nav";
import { getStockNews } from "@/lib/fmp";
import { NEWS_PAGE_SIZE, pageNumber } from "@/lib/paging";

export default async function NewsPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const { page: pageParam } = await searchParams;
  const page = pageNumber(pageParam);
  const items = await getStockNews(NEWS_PAGE_SIZE, page - 1);
  return (
    <Container>
      <PageHeader title="Market News" description="Latest headlines across the stock market." />
      <SectionNav items={NEWS_NAV} />
      <NewsWindowPager items={items} page={page} pageSize={NEWS_PAGE_SIZE} path="/news" />
    </Container>
  );
}
