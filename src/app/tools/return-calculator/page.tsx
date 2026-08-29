import Link from "next/link";
import { Container } from "@/components/container";
import { PageHeader } from "@/components/page-header";
import { formatDate, formatMoney, formatPercentPlain, formatPrice } from "@/lib/format";
import { getDailyChart, getDividends, getQuote } from "@/lib/fmp";
import { decodeTicker, quoteHref } from "@/lib/listings";
import { addDays, isoDate, nyDateString } from "@/lib/utils";

export const metadata = {
  title: "Stock Return Calculator",
  description: "Price return, cash dividends, and CAGR from live FMP historical prices.",
};

function parseDate(value: string | undefined, fallback: string) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return fallback;
  return value;
}

function parseAmount(value: string | undefined) {
  const amount = Number(value);
  return Number.isFinite(amount) && amount > 0 ? amount : 10_000;
}

export default async function ReturnCalculatorPage({
  searchParams,
}: {
  searchParams: Promise<{ symbol?: string; start?: string; end?: string; amount?: string }>;
}) {
  const params = await searchParams;
  const ticker = decodeTicker(params.symbol || "AAPL");
  const today = nyDateString();
  const defaultStart = isoDate(addDays(new Date(`${today}T00:00:00Z`), -365 * 5));
  const rawStart = parseDate(params.start, defaultStart);
  const rawEnd = parseDate(params.end, today);
  const start = rawStart <= rawEnd ? rawStart : rawEnd;
  const end = rawStart <= rawEnd ? rawEnd : rawStart;
  const amount = parseAmount(params.amount);
  const [quote, candles, dividends] = await Promise.all([
    getQuote(ticker),
    getDailyChart(ticker, start, end),
    getDividends(ticker, 120),
  ]);
  const points = [...candles].filter((row) => row.price > 0).sort((a, b) => a.date.localeCompare(b.date));
  const first = points[0] ?? null;
  const last = points.at(-1) ?? null;
  const years =
    first && last
      ? (new Date(`${last.date}T00:00:00Z`).getTime() - new Date(`${first.date}T00:00:00Z`).getTime()) /
        (365.25 * 24 * 3600 * 1000)
      : 0;
  const shares = first ? amount / first.price : null;
  const cashDividends = dividends
    .filter((row) => row.date >= (first?.date ?? start) && row.date <= (last?.date ?? end))
    .reduce((sum, row) => sum + (row.adjDividend || row.dividend || 0), 0);
  const endingPrice = shares != null && last ? shares * last.price : null;
  const dividendIncome = shares != null ? shares * cashDividends : null;
  const endingValue =
    endingPrice != null && dividendIncome != null ? endingPrice + dividendIncome : endingPrice;
  const profit = endingValue != null ? endingValue - amount : null;
  const totalReturn = first && last ? last.price / first.price - 1 : null;
  const totalReturnWithDiv =
    endingValue != null && amount > 0 ? endingValue / amount - 1 : totalReturn;
  const cagr = first && last && years > 0 ? Math.pow(last.price / first.price, 1 / years) - 1 : null;
  const cagrWithDiv =
    endingValue != null && amount > 0 && years > 0 ? Math.pow(endingValue / amount, 1 / years) - 1 : cagr;
  const name = quote?.name ?? ticker;
  const currency = "USD";

  return (
    <Container>
      <PageHeader
        title="Stock Return Calculator"
        description="Uses live FMP daily closes. Ending value includes cash dividends in the window and does not assume reinvestment."
      />
      <form method="get" className="mb-8 grid gap-3 rounded-lg border border-border bg-muted-bg p-4 sm:grid-cols-2 lg:grid-cols-5">
        <label className="text-sm">
          <span className="mb-1 block text-muted">Symbol</span>
          <input name="symbol" defaultValue={ticker} className="sa-input" />
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-muted">Start</span>
          <input name="start" type="date" defaultValue={start} className="sa-input" />
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-muted">End</span>
          <input name="end" type="date" defaultValue={end} className="sa-input" />
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-muted">Amount invested</span>
          <input name="amount" type="number" min={1} step="1" defaultValue={amount} className="sa-input" />
        </label>
        <div className="flex items-end">
          <button className="sa-btn sa-btn-primary" type="submit">
            Calculate
          </button>
        </div>
      </form>

      <p className="mb-4 text-sm text-muted">
        <Link href={quoteHref(ticker, { name, exchange: quote?.exchange })} className="text-link hover:underline">
          {name} ({ticker})
        </Link>
        {quote?.price != null ? ` · last ${formatPrice(quote.price)}` : null}
        {" · "}
        <Link href={`/tools/cagr?symbol=${encodeURIComponent(ticker)}&start=${start}&end=${end}`} className="text-link hover:underline">
          CAGR calculator
        </Link>
      </p>

      {first && last ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Stat label="Starting close" value={`${formatPrice(first.price)} · ${formatDate(first.date)}`} />
            <Stat label="Ending close" value={`${formatPrice(last.price)} · ${formatDate(last.date)}`} />
            <Stat label="Shares bought" value={shares != null ? shares.toLocaleString("en-US", { maximumFractionDigits: 4 }) : "—"} />
            <Stat label="Cash dividends / share" value={formatMoney(cashDividends, currency)} />
            <Stat label="Ending market value" value={formatMoney(endingPrice, currency)} />
            <Stat label="Dividend income" value={formatMoney(dividendIncome, currency)} />
            <Stat label="Ending value" value={formatMoney(endingValue, currency)} />
            <Stat label="Profit / loss" value={formatMoney(profit, currency)} />
            <Stat label="Price return" value={formatPercentPlain(totalReturn)} />
            <Stat label="Total return" value={formatPercentPlain(totalReturnWithDiv)} />
            <Stat label="Price CAGR" value={formatPercentPlain(cagr)} />
            <Stat label="Total CAGR" value={formatPercentPlain(cagrWithDiv)} />
          </div>
          {years > 0 ? (
            <p className="mt-3 text-sm text-muted">
              {years.toFixed(2)} years · {points.length} daily closes · invested {formatMoney(amount, currency)}. Cash dividends are not reinvested.
            </p>
          ) : null}
        </>
      ) : (
        <p className="text-sm text-muted">No daily closes were returned for {ticker} in this window.</p>
      )}
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
