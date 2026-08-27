import Link from "next/link";
import { Container } from "@/components/container";
import { PageHeader } from "@/components/page-header";
import { formatDate, formatPercentPlain, formatPrice } from "@/lib/format";
import { getDailyChart, getQuote } from "@/lib/fmp";
import { decodeTicker, quoteHref } from "@/lib/listings";
import { addDays, isoDate, nyDateString } from "@/lib/utils";

export const metadata = {
  title: "CAGR Calculator",
  description: "Compound annual growth rate from live FMP historical prices.",
};

function parseDate(value: string | undefined, fallback: string) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return fallback;
  return value;
}

export default async function CagrCalculatorPage({
  searchParams,
}: {
  searchParams: Promise<{ symbol?: string; start?: string; end?: string }>;
}) {
  const params = await searchParams;
  const ticker = decodeTicker(params.symbol || "AAPL");
  const today = nyDateString();
  const defaultStart = isoDate(addDays(new Date(`${today}T00:00:00Z`), -365 * 10));
  const start = parseDate(params.start, defaultStart);
  const end = parseDate(params.end, today);
  const [quote, candles] = await Promise.all([getQuote(ticker), getDailyChart(ticker, start, end)]);
  const points = [...candles].filter((row) => row.price > 0).sort((a, b) => a.date.localeCompare(b.date));
  const first = points[0] ?? null;
  const last = points.at(-1) ?? null;
  const years =
    first && last ? (new Date(`${last.date}T00:00:00Z`).getTime() - new Date(`${first.date}T00:00:00Z`).getTime()) / (365.25 * 24 * 3600 * 1000) : 0;
  const totalReturn = first && last ? last.price / first.price - 1 : null;
  const cagr = first && last && years > 0 ? Math.pow(last.price / first.price, 1 / years) - 1 : null;
  const name = quote?.name ?? ticker;

  return (
    <Container>
      <PageHeader
        title="CAGR Calculator"
        description="Uses live daily closes from Financial Modeling Prep. CAGR is (ending ÷ starting)^(1 ÷ years) − 1."
      />
      <form className="mb-8 grid gap-3 rounded-lg border border-border bg-muted-bg p-4 sm:grid-cols-4">
        <label className="text-sm">
          <span className="mb-1 block text-muted">Symbol</span>
          <input name="symbol" defaultValue={ticker} className="h-9 w-full rounded-md border border-border bg-white px-2" />
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-muted">Start</span>
          <input name="start" type="date" defaultValue={start} className="h-9 w-full rounded-md border border-border bg-white px-2" />
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-muted">End</span>
          <input name="end" type="date" defaultValue={end} className="h-9 w-full rounded-md border border-border bg-white px-2" />
        </label>
        <div className="flex items-end">
          <button className="h-9 rounded-md bg-header px-4 text-sm font-medium text-white" type="submit">
            Calculate
          </button>
        </div>
      </form>

      <p className="mb-4 text-sm text-muted">
        <Link href={quoteHref(ticker, { name, exchange: quote?.exchange })} className="text-link hover:underline">
          {name} ({ticker})
        </Link>
        {quote?.price != null ? ` · last ${formatPrice(quote.price)}` : null}
      </p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Starting close" value={first ? `${formatPrice(first.price)} · ${formatDate(first.date)}` : "—"} />
        <Stat label="Ending close" value={last ? `${formatPrice(last.price)} · ${formatDate(last.date)}` : "—"} />
        <Stat label="Total return" value={formatPercentPlain(totalReturn)} />
        <Stat label="CAGR" value={formatPercentPlain(cagr)} />
      </div>
      {years > 0 ? <p className="mt-3 text-sm text-muted">{years.toFixed(2)} years · {points.length} daily closes in this window.</p> : null}
    </Container>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border p-4">
      <div className="text-sm text-muted">{label}</div>
      <div className="mt-1 text-xl font-semibold tabular">{value}</div>
    </div>
  );
}
