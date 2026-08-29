import { StatusLink, StatusPage } from "@/components/status-page";

export default function EtfNotFound() {
  return (
    <StatusPage
      kicker="Missing fund"
      title="ETF not found"
      message="We could not load this ticker from Financial Modeling Prep."
      showSearch
    >
      <StatusLink href="/etf">Back to ETF list</StatusLink>
      <StatusLink href="/screener?type=etf">ETF screener</StatusLink>
    </StatusPage>
  );
}
