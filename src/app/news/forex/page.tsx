import { Container } from "@/components/container";
import { NewsWindowPager } from "@/components/news-window-pager";
import { PageHeader } from "@/components/page-header";
import { SectionNav } from "@/components/section-nav";
import { NEWS_NAV } from "@/lib/nav";
import { getForexNewsLatest } from "@/lib/fmp";
import { NEWS_PAGE_SIZE, pageNumber } from "@/lib/paging";

export const metadata = {
  title: "Forex News",
  description: "Latest currency and FX headlines from Financial Modeling Prep.",
};

export default async function ForexNewsPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const { page: pageParam } = await searchParams;
  const page = pageNumber(pageParam);
  const items = await getForexNewsLatest(NEWS_PAGE_SIZE, page - 1);
  return (
    <Container>
      <PageHeader title="Forex News" description="Latest headlines covering major currency pairs and the dollar." />
      <SectionNav items={NEWS_NAV} />
      <NewsWindowPager items={items} page={page} pageSize={NEWS_PAGE_SIZE} path="/news/forex" />
    </Container>
  );
}
