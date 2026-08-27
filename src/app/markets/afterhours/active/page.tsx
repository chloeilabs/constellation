import { ExtendedHoursKindPage } from "@/components/extended-hours-page";

export const metadata = {
  title: "After-Hours Most Active",
  description: "Most active after-hours stocks from live FMP aftermarket volume.",
};

export default function AfterHoursActivePage() {
  return <ExtendedHoursKindPage session="afterhours" kind="active" />;
}
