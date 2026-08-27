import { ExtendedHoursOverviewPage } from "@/components/extended-hours-page";

export const metadata = {
  title: "Premarket Stock Movers",
  description: "Premarket and extended-hours stock movers from live Financial Modeling Prep aftermarket prints.",
};

export default function PremarketPage() {
  return <ExtendedHoursOverviewPage session="premarket" />;
}
