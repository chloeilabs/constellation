import { StatusLink, StatusPage } from "@/components/status-page";

export default function FundNotFound() {
  return (
    <StatusPage
      kicker="Missing fund"
      title="Fund not found"
      message="We could not load this mutual fund ticker from Financial Modeling Prep."
      showSearch
    >
      <StatusLink href="/funds">Back to fund list</StatusLink>
      <StatusLink href="/screener?type=fund">Fund screener</StatusLink>
    </StatusPage>
  );
}
