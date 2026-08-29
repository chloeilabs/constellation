import { Container } from "@/components/container";
import { DividendHistoryTable } from "@/components/dividend-history-table";
import { PageHeader } from "@/components/page-header";
import { formatPercentPlain, formatPrice } from "@/lib/format";
import {
  DISTRIBUTION_HISTORY_LIMIT,
  dividendTtmGrowth,
  dividendYieldFromPrice,
  trailingDividendWindow,
} from "@/lib/dividends";
import { getDividends, getQuote } from "@/lib/fmp";
import { decodeTicker } from "@/lib/listings";
import { pageNumber, paginate } from "@/lib/paging";
import { nyDateString, payoutFrequencyLabel } from "@/lib/utils";
import { vehiclePath, type VehicleKind } from "@/lib/vehicle";

export async function VehicleDividend({
  symbol,
  kind,
  page: pageParam,
}: {
  symbol: string;
  kind: VehicleKind;
  page?: string;
}) {
  const ticker = decodeTicker(symbol);
  const path = vehiclePath(kind, ticker, "/dividend");
  const [dividends, quote] = await Promise.all([
    getDividends(ticker, DISTRIBUTION_HISTORY_LIMIT),
    getQuote(ticker),
  ]);
  const latest = dividends[0];
  const asOf = nyDateString();
  const ttm = trailingDividendWindow(dividends, asOf);
  const ttmYield = dividendYieldFromPrice(ttm, quote?.price);
  const ttmGrowth = dividendTtmGrowth(dividends, asOf);
  const payments = paginate(dividends, pageNumber(pageParam));

  return (
    <Container>
      <PageHeader title={`${ticker} Dividend`} description="Distribution history, yield, and payment dates." />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <div className="rounded-lg border border-border p-4">
          <div className="text-sm text-muted">Last Distribution</div>
          <div className="mt-1 text-2xl font-semibold tabular">${formatPrice(latest?.dividend)}</div>
        </div>
        <div className="rounded-lg border border-border p-4">
          <div className="text-sm text-muted">TTM Distributions</div>
          <div className="mt-1 text-2xl font-semibold tabular">${formatPrice(ttm)}</div>
        </div>
        <div className="rounded-lg border border-border p-4">
          <div className="text-sm text-muted">Yield</div>
          <div className="mt-1 text-2xl font-semibold tabular">
            {ttmYield != null
              ? formatPercentPlain(ttmYield)
              : latest?.yield != null
                ? formatPercentPlain(latest.yield, { alreadyPercent: true })
                : "—"}
          </div>
        </div>
        <div className="rounded-lg border border-border p-4">
          <div className="text-sm text-muted">Frequency</div>
          <div className="mt-1 text-2xl font-semibold">{payoutFrequencyLabel(latest?.frequency) ?? "—"}</div>
        </div>
        <div className="rounded-lg border border-border p-4">
          <div className="text-sm text-muted">Dividend Growth (1Y)</div>
          <div className="mt-1 text-2xl font-semibold tabular">{formatPercentPlain(ttmGrowth)}</div>
        </div>
      </div>
      <DividendHistoryTable
        rows={payments.rows}
        from={payments.from}
        to={payments.to}
        total={payments.total}
        page={payments.page}
        pageCount={payments.pageCount}
        path={path}
        formatAmount={(value) => `$${formatPrice(value)}`}
      />
    </Container>
  );
}
