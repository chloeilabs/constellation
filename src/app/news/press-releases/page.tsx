import { Container } from "@/components/container";
import { NewsList } from "@/components/news-list";
import { PageHeader } from "@/components/page-header";
import { SectionNav } from "@/components/section-nav";
import { NEWS_NAV } from "@/lib/nav";
import { getLatestPressReleases } from "@/lib/fmp";

export default async function PressReleasesNewsPage() {
  const items = await getLatestPressReleases(40);
  return (
    <Container>
      <PageHeader
        title="Press Releases"
        description="Official company announcements, including earnings, lawsuits, and corporate updates."
      />
      <SectionNav items={NEWS_NAV} />
      <NewsList items={items} />
    </Container>
  );
}
