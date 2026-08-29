import { redirect } from "next/navigation";

export default function FundScreenerRedirect() {
  redirect("/screener?type=fund");
}
