import { StatusLink, StatusPage } from "@/components/status-page";

export default function NotFound() {
  return (
    <StatusPage
      kicker="404"
      title="Page not found"
      message="That URL is not in this site. Search for a ticker or go back to the homepage."
      showSearch
    >
      <StatusLink href="/" variant="primary">
        Back to home
      </StatusLink>
      <StatusLink href="/screener">Open the screener</StatusLink>
    </StatusPage>
  );
}
