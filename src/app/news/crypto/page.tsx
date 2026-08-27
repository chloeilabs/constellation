import { Container } from "@/components/container";
import { NewsList } from "@/components/news-list";
import { PageHeader } from "@/components/page-header";
import { SectionNav } from "@/components/section-nav";
import { NEWS_NAV } from "@/lib/nav";
import { getCryptoNewsLatest } from "@/lib/fmp";

export const metadata = {
  title: "Cryptocurrency News",
  description: "Latest crypto headlines from Financial Modeling Prep.",
};

export default async function CryptoNewsPage() {
  const items = await getCryptoNewsLatest(40);
  return (
    <Container>
      <PageHeader
        title="Cryptocurrency News"
        description="Latest Bitcoin, Ethereum, and digital-asset headlines."
      />
      <SectionNav items={NEWS_NAV} />
      <NewsList items={items} />
    </Container>
  );
}
