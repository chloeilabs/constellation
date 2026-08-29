import Link from "next/link";
import { Container } from "@/components/container";
import { DailyPriceTable } from "@/components/daily-price-table";
import { PageHeader, RangeToggle } from "@/components/page-header";
import { formatMoney } from "@/lib/format";
import { getProfile } from "@/lib/fmp";
import { decodeTicker } from "@/lib/listings";
import { pageNumber, paginate } from "@/lib/paging";
import { loadDailyPriceHistory } from "@/lib/price-history";
import { vehicleNoun, vehiclePath, type VehicleKind } from "@/lib/vehicle";

export async function VehicleHistory({
  symbol,
  kind,
  years,
  page: pageParam,
}: {
  symbol: string;
  kind: VehicleKind;
  years?: string;
  page?: string;
}) {
  const ticker = decodeTicker(symbol);
  const noun = vehicleNoun(kind);
  const path = vehiclePath(kind, ticker, "/history");
  const [{ range, from, today, daily, yearsQuery, rangeSlug }, profile] = await Promise.all([
    loadDailyPriceHistory(ticker, years),
    getProfile(ticker),
  ]);
  const pricePage = paginate(daily, pageNumber(pageParam));
  const csvQuery = new URLSearchParams();
  if (yearsQuery) csvQuery.set("years", yearsQuery);
  const csvHref = csvQuery.size ? `${path}/csv?${csvQuery}` : `${path}/csv`;
  const px = (value: number | null | undefined) => formatMoney(value, profile?.currency);

  return (
    <Container>
      <PageHeader
        title={`${ticker} Price History`}
        description={`Daily ${noun} prices and dividend-adjusted close from Financial Modeling Prep.`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <RangeToggle
              range={range}
              sixHref={path}
              oneHref={`${path}?years=1`}
              fiveHref={`${path}?years=5`}
              tenHref={`${path}?years=10`}
              maxHref={`${path}?years=max`}
            />
            <Link
              href={`/tools/return-calculator?symbol=${encodeURIComponent(ticker)}&start=${from}&end=${today}`}
              className="sa-btn sa-btn-secondary"
            >
              Return Calculator
            </Link>
          </div>
        }
      />
      <DailyPriceTable
        rows={pricePage.rows}
        from={pricePage.from}
        to={pricePage.to}
        total={pricePage.total}
        page={pricePage.page}
        pageCount={pricePage.pageCount}
        path={path}
        extra={{ years: yearsQuery }}
        csvHref={daily.length ? csvHref : undefined}
        rangeSlug={rangeSlug}
        formatPrice={px}
        showAdjClose
      />
    </Container>
  );
}
