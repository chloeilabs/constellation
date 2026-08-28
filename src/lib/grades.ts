import type { FmpGrade, FmpPriceTargetNews } from "@/lib/types";

export function gradeActionLabel(action?: string | null) {
  const value = (action || "").toLowerCase();
  if (value === "initialise" || value === "initialize" || value === "init") return "Initiate";
  if (value === "upgrade") return "Upgrade";
  if (value === "downgrade") return "Downgrade";
  if (value === "hold" || value === "maintain" || value === "maintains") return "Maintains";
  return action ? action.replace(/^\w/, (char) => char.toUpperCase()) : "—";
}

export function gradeActionKind(action?: string | null) {
  const label = gradeActionLabel(action);
  if (label === "Upgrade") return "upgrades";
  if (label === "Downgrade") return "downgrades";
  if (label === "Initiate") return "initiations";
  if (label === "Maintains") return "maintains";
  return "other";
}

function firmKey(value?: string | null) {
  return (value || "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

export function enrichGradesWithTargets(grades: FmpGrade[], news: FmpPriceTargetNews[]) {
  return grades.map((grade) => {
    const firm = firmKey(grade.gradingCompany);
    const date = grade.date.slice(0, 10);
    const gradeMs = Date.parse(date);
    const match = news
      .map((row) => {
        const company = firmKey(row.analystCompany || row.newsPublisher);
        if (!firm || !company || (!company.includes(firm) && !firm.includes(company))) return null;
        const newsMs = Date.parse((row.publishedDate || "").slice(0, 10));
        const diff = Number.isFinite(gradeMs) && Number.isFinite(newsMs) ? Math.abs(newsMs - gradeMs) : Number.POSITIVE_INFINITY;
        if (diff > 21 * 86_400_000) return null;
        return { row, diff };
      })
      .filter((item): item is { row: FmpPriceTargetNews; diff: number } => item != null)
      .sort((a, b) => a.diff - b.diff)[0]?.row;
    return { grade, news: match ?? null };
  });
}
