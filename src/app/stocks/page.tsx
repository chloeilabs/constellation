import Link from "next/link";
import { SymbolDirectory } from "@/components/symbol-directory";
import { STOCKS_NAV } from "@/lib/nav";
import { getListedUsStocks } from "@/lib/fmp";

export const metadata = {
  title: "All Stock Symbols",
  description: "U.S. stocks listed on Nasdaq, NYSE, and NYSE American, with live quotes from Financial Modeling Prep.",
};

export default async function StocksListPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page } = await searchParams;
  const rows = await getListedUsStocks();
  return (
    <SymbolDirectory
      title="All Stock Symbols"
      description="Common stocks listed on Nasdaq, NYSE, and NYSE American, shown alphabetically with live FMP quotes."
      nav={STOCKS_NAV}
      hrefBase="/stocks"
      rows={rows}
      page={page}
      empty="No U.S. stock listings available."
      actions={
        <Link href="/screener" className="text-sm text-link hover:underline">
          Open screener
        </Link>
      }
    />
  );
}
