import { Container } from "@/components/container";
import { PageHeader } from "@/components/page-header";
import { Toolkit } from "@/components/toolkit";

export const metadata = {
  title: "Tools",
  description: "Stock screener, reverse ETF lookup, compare, watchlist, and other market tools.",
};

export default function ToolsPage() {
  return (
    <Container>
      <PageHeader
        title="Tools"
        description="Screen stocks, look up ETF holders, compare issuers, and jump into live market data."
      />
      <Toolkit />
    </Container>
  );
}
