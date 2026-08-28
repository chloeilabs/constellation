import Link from "next/link";
import { SymbolDirectory } from "@/components/symbol-directory";
import { ETF_NAV } from "@/lib/nav";
import { getListedUsFunds } from "@/lib/fmp";

export const metadata = {
  title: "Mutual Funds",
  description: "U.S. mutual funds listed alphabetically, with live prices from Financial Modeling Prep.",
};

export default async function FundsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page } = await searchParams;
  const rows = await getListedUsFunds();
  return (
    <SymbolDirectory
      title="Mutual Funds"
      description="U.S. mutual funds from FMP, listed alphabetically with live prices."
      nav={ETF_NAV}
      hrefBase="/funds"
      rows={rows}
      page={page}
      showIndustry={false}
      empty="No mutual fund data available."
      actions={
        <div className="flex gap-4 text-sm">
          <Link href="/etf/compare?symbols=VTSAX,VFIAX" className="text-link hover:underline">
            Compare funds
          </Link>
          <Link href="/etf" className="text-link hover:underline">
            All ETFs
          </Link>
        </div>
      }
    />
  );
}
