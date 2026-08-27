import { Container } from "@/components/container";
import { NewsList } from "@/components/news-list";
import { PageHeader } from "@/components/page-header";
import { SectionNav } from "@/components/section-nav";
import { NEWS_NAV } from "@/lib/nav";
import { getGeneralNews } from "@/lib/fmp";

export default async function GeneralNewsPage() {
  const items = await getGeneralNews(40);
  return (
    <Container>
      <PageHeader
        title="General Market News"
        description="Broader market, economy, and company headlines beyond single-stock stories."
      />
      <SectionNav items={NEWS_NAV} />
      <NewsList items={items} />
    </Container>
  );
}
