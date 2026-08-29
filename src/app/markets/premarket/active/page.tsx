import { ExtendedHoursKindPage } from "@/components/extended-hours-page";

export const metadata = {
  title: "Pre-Market Most Active",
  description: "Most active premarket and extended-hours stocks from live FMP aftermarket volume.",
};

export default function PremarketActivePage() {
  return <ExtendedHoursKindPage session="premarket" kind="active" />;
}
