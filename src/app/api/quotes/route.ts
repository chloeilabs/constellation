import { NextRequest } from "next/server";
import { getQuotes } from "@/lib/fmp";

export async function GET(request: NextRequest) {
  const symbols = (request.nextUrl.searchParams.get("symbols") ?? "")
    .split(",")
    .map((symbol) => symbol.trim())
    .filter(Boolean);
  const quotes = await getQuotes(symbols);
  return Response.json(quotes);
}
