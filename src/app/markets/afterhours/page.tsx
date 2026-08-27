import { ExtendedHoursOverviewPage } from "@/components/extended-hours-page";

export const metadata = {
  title: "After-Hours Stock Movers",
  description: "After-hours stock movers from live Financial Modeling Prep aftermarket trades and quotes.",
};

export default function AfterHoursPage() {
  return <ExtendedHoursOverviewPage session="afterhours" />;
}
