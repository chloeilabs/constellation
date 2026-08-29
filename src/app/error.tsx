"use client";

import { StatusLink, StatusPage } from "@/components/status-page";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <StatusPage
      kicker="Error"
      title="Something went wrong"
      message={error.message || "An unexpected error occurred while loading this page."}
      showSearch
    >
      <button type="button" onClick={reset} className="sa-btn sa-btn-primary">
        Try again
      </button>
      <StatusLink href="/" variant="primary">
        Back to home
      </StatusLink>
    </StatusPage>
  );
}
