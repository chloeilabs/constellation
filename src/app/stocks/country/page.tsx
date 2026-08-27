import Link from "next/link";
import { Container } from "@/components/container";
import { PageHeader } from "@/components/page-header";
import { SectionNav } from "@/components/section-nav";
import { STOCKS_NAV } from "@/lib/nav";
import { COUNTRY_MARKETS, COUNTRY_REGIONS, countryHref } from "@/lib/countries";

export const metadata = {
  title: "Stocks by Country",
  description: "Browse the largest listings on major global exchanges, ranked by market cap from live FMP data.",
};

export default function CountryIndexPage() {
  return (
    <Container>
      <PageHeader
        title="Stocks by Country"
        description="Largest companies on each local exchange. Country screens always pair FMP country with the home venue so dual listings on Warsaw or OTC do not inflate the ranking."
      />
      <SectionNav items={STOCKS_NAV} />
      <div className="space-y-10">
        {COUNTRY_REGIONS.map((region) => {
          const markets = COUNTRY_MARKETS.filter((market) => market.region === region.id);
          return (
            <section key={region.id}>
              <h2 className="mb-4 text-xl font-semibold text-header">{region.title}</h2>
              <div className="overflow-x-auto rounded-lg border border-border">
                <table className="sa-table">
                  <thead>
                    <tr>
                      <th>Country</th>
                      <th>Exchange</th>
                      <th>Currency</th>
                    </tr>
                  </thead>
                  <tbody>
                    {markets.map((market) => (
                      <tr key={market.code}>
                        <td>
                          <Link href={countryHref(market.code)} className="text-link hover:underline">
                            {market.name}
                          </Link>
                        </td>
                        <td className="text-muted">{market.exchangeName}</td>
                        <td className="text-muted">{market.currency}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          );
        })}
      </div>
    </Container>
  );
}
