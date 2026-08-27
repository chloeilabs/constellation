import Link from "next/link";
import { Container } from "@/components/container";
import { PageHeader } from "@/components/page-header";
import { SectionNav } from "@/components/section-nav";
import { quoteFundamentalsNav } from "@/lib/nav";
import { MetricCards } from "@/components/metric-cards";
import { ChangePercent } from "@/components/change";
import { formatDate, formatMoney, formatRatio } from "@/lib/format";
import { getDcf, getKeyMetricsTtm, getLeveredDcf, getProfile, getQuote, getRatings } from "@/lib/fmp";
import { decodeTicker, stockPath } from "@/lib/listings";

function num(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function gap(fair: number | null, price: number | null) {
  if (fair == null || price == null || price === 0) return null;
  return (fair - price) / price;
}

export default async function FairValuePage({ params }: { params: Promise<{ symbol: string }> }) {
  const { symbol } = await params;
  const ticker = decodeTicker(symbol);
  const [quote, profile, dcf, levered, metrics, ratings] = await Promise.all([
    getQuote(ticker),
    getProfile(ticker),
    getDcf(ticker),
    getLeveredDcf(ticker),
    getKeyMetricsTtm(ticker),
    getRatings(ticker),
  ]);
  const currency = profile?.currency || "USD";
  const px = (value: number | null | undefined) => formatMoney(value, currency);
  const price = num(quote?.price) ?? num(dcf?.stockPrice);
  const unlevered = num(dcf?.dcf);
  const leveredValue = num(levered?.dcf);
  const graham = num(metrics?.grahamNumberTTM);
  const grahamNetNet = num(metrics?.grahamNetNetTTM);
  const priceToDcf = price != null && unlevered != null && unlevered !== 0 ? price / unlevered : null;

  return (
    <Container>
      <PageHeader
        title={`${ticker} Fair Value`}
        description="Discounted cash flow and Graham estimates from live FMP models, compared with the last share price."
        actions={
          <Link
            href={stockPath(ticker, "/forecast")}
            className="inline-flex items-center rounded-md border border-border-strong px-3 py-1.5 text-sm font-medium hover:bg-muted-bg"
          >
            Analyst Forecast
          </Link>
        }
      />
      <SectionNav items={quoteFundamentalsNav(ticker)} />
      <MetricCards
        items={[
          { label: "Last Price", value: px(price) },
          {
            label: "Unlevered DCF",
            value: px(unlevered),
            hint: dcf?.date ? `Model ${formatDate(dcf.date)}` : undefined,
          },
          {
            label: "DCF Upside",
            value: gap(unlevered, price) == null ? "—" : <ChangePercent value={gap(unlevered, price)} alreadyPercent={false} className="text-2xl" />,
          },
          { label: "Levered DCF", value: px(leveredValue) },
          {
            label: "Levered Upside",
            value:
              gap(leveredValue, price) == null ? "—" : (
                <ChangePercent value={gap(leveredValue, price)} alreadyPercent={false} className="text-2xl" />
              ),
          },
          { label: "Graham Number", value: px(graham) },
          {
            label: "Graham Upside",
            value:
              graham != null && graham > 0 && gap(graham, price) != null ? (
                <ChangePercent value={gap(graham, price)} alreadyPercent={false} className="text-2xl" />
              ) : (
                "—"
              ),
          },
          { label: "Graham Net-Net", value: px(grahamNetNet) },
          { label: "Price / DCF", value: formatRatio(priceToDcf) },
          { label: "FMP Rating", value: ratings?.rating ?? "—" },
          { label: "DCF Score", value: ratings?.discountedCashFlowScore ?? "—" },
        ]}
      />
      <p className="mt-4 text-sm text-muted">
        Unlevered and levered DCF values come from Financial Modeling Prep&apos;s discounted-cash-flow models, not from
        Stock Analysis Pro formulas (Lynch/Graham upside on the public site is paywalled). A DCF below the market price
        means the model sees the stock as expensive relative to projected cash flows. Graham Number uses EPS and book
        value; Graham Net-Net is net current asset value per share. Price / DCF is last price divided by unlevered DCF.
      </p>
    </Container>
  );
}
