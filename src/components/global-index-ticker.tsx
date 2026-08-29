import { IndexTicker } from "@/components/index-ticker";
import { getIndexQuotes, getMarketHours, hasFmpKey } from "@/lib/fmp";

export async function GlobalIndexTicker() {
  if (!hasFmpKey()) return null;
  const [quotes, hours] = await Promise.all([getIndexQuotes(), getMarketHours("NASDAQ")]);
  return <IndexTicker quotes={quotes} hours={hours} />;
}
