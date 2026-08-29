import { ExtendedHoursKindPage } from "@/components/extended-hours-page";

export const metadata = {
  title: "After-Hours Losers",
  description: "Stocks with the largest after-hours declines from live FMP aftermarket prints.",
};

export default function AfterHoursLosersPage() {
  return <ExtendedHoursKindPage session="afterhours" kind="losers" />;
}
