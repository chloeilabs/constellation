import { Container } from "@/components/container";
import { CongressTable } from "@/components/congress-table";
import { PageHeader } from "@/components/page-header";
import { loadSymbolCongressTrades } from "@/lib/congress";

export default async function StockCongressPage({ params }: { params: Promise<{ symbol: string }> }) {
  const { symbol } = await params;
  const ticker = symbol.toUpperCase();
  const rows = await loadSymbolCongressTrades(ticker, 75);

  return (
    <Container>
      <PageHeader
        title={`${ticker} Congressional Trades`}
        description={`STOCK Act disclosures from U.S. senators and representatives involving ${ticker}.`}
      />
      <CongressTable
        rows={rows}
        showSymbol={false}
        empty={`No recent congressional trades reported for ${ticker}.`}
      />
    </Container>
  );
}
