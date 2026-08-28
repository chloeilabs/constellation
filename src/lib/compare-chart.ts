export const COMPARE_CHART_SPANS = ["1M", "3M", "6M", "YTD", "1Y", "3Y", "5Y", "10Y", "MAX"] as const;
export type CompareChartSpan = (typeof COMPARE_CHART_SPANS)[number];

export function compareChartSpan(value?: string): CompareChartSpan {
  const normalized = value?.trim().toUpperCase();
  if (normalized === "ALL") return "MAX";
  if (normalized && (COMPARE_CHART_SPANS as readonly string[]).includes(normalized)) {
    return normalized as CompareChartSpan;
  }
  return "1Y";
}

export function compareChartHref(pathname: string, symbols: string[], span: CompareChartSpan) {
  const params = new URLSearchParams();
  params.set("symbols", symbols.join(","));
  if (span !== "1Y") params.set("chart", span);
  return `${pathname}?${params.toString()}`;
}
