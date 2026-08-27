import { NextRequest } from "next/server";
import { searchAll } from "@/lib/fmp";

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q") ?? "";
  const results = await searchAll(query, 8);
  return Response.json(results);
}
