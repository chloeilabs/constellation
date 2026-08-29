import { loadCorporateActions } from "@/lib/corporate-actions";
import { csvResponse, toCsv } from "@/lib/csv";

export async function GET() {
  const rows = await loadCorporateActions();
  return csvResponse(
    "corporate-actions.csv",
    toCsv(
      ["Date", "Symbol", "Type", "Action"],
      rows.map((row) => [row.date, row.symbol, row.type, row.action]),
    ),
  );
}
