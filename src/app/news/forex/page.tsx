import { Container } from "@/components/container";
import { NewsList } from "@/components/news-list";
import { PageHeader } from "@/components/page-header";
import { SectionNav } from "@/components/section-nav";
import { NEWS_NAV } from "@/lib/nav";
import { getForexNewsLatest } from "@/lib/fmp";

export const metadata = {
  title: "Forex News",
  description: "Latest currency and FX headlines from Financial Modeling Prep.",
};

export default async function ForexNewsPage() {
  const items = await getForexNewsLatest(40);
  return (
    <Container>
      <PageHeader title="Forex News" description="Latest headlines covering major currency pairs and the dollar." />
      <SectionNav items={NEWS_NAV} />
      <NewsList items={items} />
    </Container>
  );
}
