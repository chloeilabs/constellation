import { Container } from "@/components/container";
import { NewsList } from "@/components/news-list";
import { PageHeader } from "@/components/page-header";
import { getStockNews } from "@/lib/fmp";

export default async function NewsPage() {
  const items = await getStockNews(40);
  return (
    <Container>
      <PageHeader title="Market News" description="Latest headlines across the stock market." />
      <NewsList items={items} />
    </Container>
  );
}
