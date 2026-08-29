import Link from "next/link";
import { Container } from "@/components/container";
import { PageHeader } from "@/components/page-header";
import { formatMoney, formatPercentPlain, formatPrice } from "@/lib/format";
import { getDividends, getQuote } from "@/lib/fmp";
import { decodeTicker, quoteHref } from "@/lib/listings";
import { annualDividendPayments } from "@/lib/utils";

export const metadata = {
  title: "Dividend Calculator",
  description: "Estimate dividend income from live FMP quotes and the latest indicated distribution.",
};

export default async function DividendCalculatorPage({
  searchParams,
}: {
  searchParams: Promise<{ symbol?: string; shares?: string; years?: string; drip?: string }>;
}) {
  const params = await searchParams;
  const ticker = decodeTicker(params.symbol || "KO");
  const shares = Math.max(1, Number(params.shares) || 100);
  const years = Math.min(40, Math.max(1, Number(params.years) || 10));
  const drip = params.drip === "1" || params.drip === "on";
  const [quote, dividends] = await Promise.all([getQuote(ticker), getDividends(ticker, 8)]);
  const latest = dividends[0];
  const payments = annualDividendPayments(latest?.frequency);
  const annualPerShare =
    latest?.dividend && payments
      ? latest.dividend * payments
      : latest?.frequency?.toLowerCase().includes("quarter")
        ? (latest?.dividend ?? 0) * 4
        : latest?.dividend ?? 0;
  const price = quote?.price ?? 0;
  const yieldPct = annualPerShare && price ? annualPerShare / price : latest?.yield != null ? latest.yield / 100 : 0;

  let shareCount = shares;
  let cash = 0;
  const schedule: { year: number; shares: number; income: number; cash: number }[] = [];
  for (let year = 1; year <= years; year++) {
    const income = annualPerShare * shareCount;
    if (drip && price > 0) {
      shareCount += income / price;
    } else {
      cash += income;
    }
    schedule.push({ year, shares: shareCount, income, cash });
  }
  const last = schedule.at(-1);
  const name = quote?.name ?? ticker;

  return (
    <Container>
      <PageHeader
        title="Dividend Calculator"
        description="Uses the latest indicated annual dividend and last price from FMP. Dividends and price are held constant — an illustration, not a forecast."
      />
      <form className="mb-8 grid gap-3 rounded-lg border border-border bg-muted-bg p-4 sm:grid-cols-5">
        <label className="text-sm">
          <span className="mb-1 block text-muted">Symbol</span>
          <input name="symbol" defaultValue={ticker} className="sa-input" />
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-muted">Shares</span>
          <input name="shares" type="number" min={1} defaultValue={shares} className="sa-input" />
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-muted">Years</span>
          <input name="years" type="number" min={1} max={40} defaultValue={years} className="sa-input" />
        </label>
        <label className="flex items-end gap-2 text-sm">
          <input name="drip" type="checkbox" value="1" defaultChecked={drip} className="h-4 w-4" />
          <span>Reinvest (DRIP)</span>
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
        {latest?.frequency ? ` · ${latest.frequency}` : null}
      </p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Price" value={formatMoney(price || null)} />
        <Stat label="Indicated annual / share" value={annualPerShare ? `$${formatPrice(annualPerShare)}` : "—"} />
        <Stat label="Indicated yield" value={formatPercentPlain(yieldPct)} />
        <Stat
          label={drip ? "Ending shares" : "Cash dividends"}
          value={drip ? formatPrice(last?.shares) : formatMoney(last?.cash ?? null)}
        />
      </div>

      <div className="mt-8 overflow-x-auto rounded-lg border border-border">
        <table className="sa-table">
          <thead>
            <tr>
              <th>Year</th>
              <th className="num">Shares</th>
              <th className="num">Dividend income</th>
              {drip ? null : <th className="num">Cumulative cash</th>}
            </tr>
          </thead>
          <tbody>
            {schedule.map((row) => (
              <tr key={row.year}>
                <td>{row.year}</td>
                <td className="num">{row.shares.toLocaleString("en-US", { maximumFractionDigits: drip ? 2 : 0 })}</td>
                <td className="num">{formatMoney(row.income)}</td>
                {drip ? null : <td className="num">{formatMoney(row.cash)}</td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
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
