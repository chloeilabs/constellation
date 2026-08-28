import Link from "next/link";
import { SymbolDirectory } from "@/components/symbol-directory";
import { ETF_NAV } from "@/lib/nav";
import { getListedUsEtfs } from "@/lib/fmp";

export const metadata = {
  title: "Exchange Traded Funds",
  description: "U.S. ETFs listed alphabetically, with live quotes from Financial Modeling Prep.",
};

export default async function EtfListPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page } = await searchParams;
  const rows = await getListedUsEtfs();
  return (
    <SymbolDirectory
      title="Exchange Traded Funds"
      description="U.S. exchange-traded funds from FMP, listed alphabetically with live quotes."
      nav={ETF_NAV}
      hrefBase="/etf"
      rows={rows}
      page={page}
      showIndustry={false}
      empty="No ETF data available."
      actions={
        <div className="flex gap-4 text-sm">
          <Link href="/etf/compare" className="text-link hover:underline">
            Compare ETFs
          </Link>
          <Link href="/etf/lookup" className="text-link hover:underline">
            Reverse ETF lookup
          </Link>
        </div>
      }
    />
  );
}
