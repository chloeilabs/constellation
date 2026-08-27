import { Container } from "@/components/container";
import { InsiderTable } from "@/components/insider-table";
import { PageHeader } from "@/components/page-header";
import { getInsiderTrades } from "@/lib/fmp";

export default async function StockInsidersPage({ params }: { params: Promise<{ symbol: string }> }) {
  const { symbol } = await params;
  const ticker = symbol.toUpperCase();
  const rows = await getInsiderTrades(ticker, 75);

  return (
    <Container>
      <PageHeader
        title={`${ticker} Insider Trading`}
        description="Form 4 purchases and sales reported by officers, directors, and 10% owners."
      />
      <InsiderTable rows={rows} showSymbol={false} empty={`No recent insider trades for ${ticker}.`} />
    </Container>
  );
}
