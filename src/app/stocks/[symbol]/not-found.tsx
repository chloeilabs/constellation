import { StatusLink, StatusPage } from "@/components/status-page";

export default function StockNotFound() {
  return (
    <StatusPage
      kicker="Missing quote"
      title="Stock not found"
      message="We could not load a quote or company profile for this symbol."
      showSearch
    >
      <StatusLink href="/screener">Browse the screener</StatusLink>
      <StatusLink href="/stocks">All stocks</StatusLink>
    </StatusPage>
  );
}
