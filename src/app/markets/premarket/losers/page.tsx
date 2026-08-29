import { ExtendedHoursKindPage } from "@/components/extended-hours-page";

export const metadata = {
  title: "Pre-Market Losers",
  description: "Stocks with the largest premarket and extended-hours declines from live FMP aftermarket prints.",
};

export default function PremarketLosersPage() {
  return <ExtendedHoursKindPage session="premarket" kind="losers" />;
}
