import { ExtendedHoursKindPage } from "@/components/extended-hours-page";

export const metadata = {
  title: "Pre-Market Gainers",
  description: "Stocks with the largest premarket and extended-hours gains from live FMP aftermarket prints.",
};

export default function PremarketGainersPage() {
  return <ExtendedHoursKindPage session="premarket" kind="gainers" />;
}
