import { redirect } from "next/navigation";

export default function EtfScreenerRedirect() {
  redirect("/screener?type=etf");
}
