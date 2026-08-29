"use client";

import "./globals.css";
import { StatusLink, StatusPage } from "@/components/status-page";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="min-h-full bg-background text-foreground">
        <StatusPage
          kicker="Error"
          title="This page crashed"
          message={error.message || "The app hit an unexpected error."}
        >
          <button type="button" onClick={reset} className="sa-btn sa-btn-primary">
            Try again
          </button>
          <StatusLink href="/">Back to home</StatusLink>
        </StatusPage>
      </body>
    </html>
  );
}
