import { notFound, redirect } from "next/navigation";
import { Container } from "@/components/container";
import { NewsList } from "@/components/news-list";
import { PageHeader } from "@/components/page-header";
import { SectionNav } from "@/components/section-nav";
import { TablePager } from "@/components/table-pager";
import { getCryptoNewsArchive, getForexNewsArchive, getQuote, hasFmpKey } from "@/lib/fmp";
import {
  MARKET_ASSET_LABEL,
  marketAssetHref,
  marketAssetKind,
  marketAssetListHref,
  normalizeMarketTicker,
} from "@/lib/listings";
import { marketAssetNewsNav } from "@/lib/nav";
import { NEWS_PAGE_SIZE, pageNumber, paginate, pagerLinks } from "@/lib/paging";

export async function MarketAssetNews({
  symbol,
  expected,
  page: pageParam,
}: {
  symbol: string;
  expected: "crypto" | "forex";
  page?: string;
}) {
  const ticker = normalizeMarketTicker(symbol);
  const page = pageNumber(pageParam);
  const [quote, items] = await Promise.all([
    getQuote(ticker),
    expected === "crypto" ? getCryptoNewsArchive(ticker) : getForexNewsArchive(ticker),
  ]);

  if (!quote) {
    if (!hasFmpKey()) {
      return (
        <Container>
          <p className="text-sm text-muted">Live {MARKET_ASSET_LABEL[expected].toLowerCase()} headlines require an FMP API key.</p>
        </Container>
      );
    }
    notFound();
  }

  const classified = marketAssetKind(ticker, { exchange: quote.exchange, name: quote.name });
  if (classified !== expected) {
    const canonical = classified ? marketAssetHref(ticker, { exchange: quote.exchange, name: quote.name }) : null;
    if (canonical) redirect(`${canonical}/news`);
    notFound();
  }

  const name = quote.name || ticker;
  const kindLabel = MARKET_ASSET_LABEL[expected];
  const listHref = marketAssetListHref(expected);
  const path = `${listHref}/${ticker}/news`;
  const feed = paginate(items, page, NEWS_PAGE_SIZE);

  return (
    <Container>
      <PageHeader
        title={`${name} (${ticker}) News`}
        description={`Headlines tagged to this ${kindLabel.toLowerCase()} pair from Financial Modeling Prep.`}
      />
      <SectionNav items={marketAssetNewsNav(expected, ticker)} />
      {feed.total === 0 ? (
        <p className="text-sm text-muted">FMP has no headlines tagged to {ticker}.</p>
      ) : (
        <>
          <NewsList items={feed.rows} />
          <TablePager
            from={feed.from}
            to={feed.to}
            total={feed.total}
            page={feed.page}
            pageCount={feed.pageCount}
            {...pagerLinks(path, feed.page, feed.pageCount)}
          />
        </>
      )}
    </Container>
  );
}
