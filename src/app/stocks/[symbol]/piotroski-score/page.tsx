import Link from "next/link";
import { Container } from "@/components/container";
import { MetricCards } from "@/components/metric-cards";
import { PageHeader } from "@/components/page-header";
import { SectionNav } from "@/components/section-nav";
import { quoteFundamentalsNav } from "@/lib/nav";
import { getScores } from "@/lib/fmp";
import { decodeTicker, stockPath } from "@/lib/listings";

export default async function PiotroskiScorePage({ params }: { params: Promise<{ symbol: string }> }) {
  const { symbol } = await params;
  const ticker = decodeTicker(symbol);
  const scores = await getScores(ticker);
  const score = scores?.piotroskiScore ?? null;

  return (
    <Container>
      <PageHeader
        title={`${ticker} Piotroski F-Score`}
        description="Nine-point financial-strength score from live FMP /financial-scores. The clone reports the FMP integer rather than inventing Stock Analysis's published total."
      />
      <SectionNav items={quoteFundamentalsNav(ticker)} />
      <MetricCards
        items={[
          { label: "Piotroski F-Score", value: score ?? "—" },
          { label: "Scale", value: "0 – 9" },
        ]}
      />
      <p className="mt-4 max-w-3xl text-sm leading-6 text-muted">
        FMP publishes a single Piotroski integer for {ticker}. Criteria-level checkboxes are not in the stable API, so
        this page does not fabricate a nine-line breakdown.
      </p>
      <p className="mt-3 text-sm">
        <Link href={stockPath(ticker, "/statistics")} className="text-link hover:underline">
          Statistics
        </Link>
        {" · "}
        <Link href={stockPath(ticker, "/altman-z-score")} className="text-link hover:underline">
          Altman Z-Score
        </Link>
        {" · "}
        <Link href={stockPath(ticker, "/financials")} className="text-link hover:underline">
          Financials
        </Link>
      </p>
    </Container>
  );
}
