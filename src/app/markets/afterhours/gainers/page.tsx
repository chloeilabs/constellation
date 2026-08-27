import { ExtendedHoursKindPage } from "@/components/extended-hours-page";

export const metadata = {
  title: "After-Hours Gainers",
  description: "Stocks with the largest after-hours gains from live FMP aftermarket prints.",
};

export default function AfterHoursGainersPage() {
  return <ExtendedHoursKindPage session="afterhours" kind="gainers" />;
}
