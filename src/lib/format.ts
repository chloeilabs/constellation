const integerFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 0,
});

const numberFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 2,
});

export function formatPrice(value: number | null | undefined, digits = 2) {
  if (value == null || Number.isNaN(value)) return "—";
  const abs = Math.abs(value);
  const fractionDigits = abs >= 1000 ? 2 : abs >= 1 ? digits : abs >= 0.01 ? 4 : 6;
  return value.toLocaleString("en-US", {
    minimumFractionDigits: Math.min(2, fractionDigits),
    maximumFractionDigits: fractionDigits,
  });
}

export function formatUsd(value: number | null | undefined, digits = 2) {
  if (value == null || Number.isNaN(value)) return "—";
  return `$${formatPrice(value, digits)}`;
}

export function formatCompact(value: number | null | undefined) {
  if (value == null || Number.isNaN(value)) return "—";
  const abs = Math.abs(value);
  if (abs >= 1e12) return `${(value / 1e12).toFixed(2)}T`;
  if (abs >= 1e9) return `${(value / 1e9).toFixed(2)}B`;
  if (abs >= 1e6) return `${(value / 1e6).toFixed(2)}M`;
  if (abs >= 1e3) return `${(value / 1e3).toFixed(2)}K`;
  return formatPrice(value);
}

export function formatCompactUsd(value: number | null | undefined) {
  if (value == null || Number.isNaN(value)) return "—";
  const sign = value < 0 ? "-" : "";
  return `${sign}$${formatCompact(Math.abs(value))}`;
}

export function formatMillions(value: number | null | undefined) {
  if (value == null || Number.isNaN(value)) return "—";
  const millions = value / 1e6;
  const abs = Math.abs(millions);
  const digits = abs >= 100 ? 0 : abs >= 10 ? 1 : 2;
  return millions.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: digits,
  });
}

export function yearOverYear(current: unknown, previous: unknown) {
  if (typeof current !== "number" || typeof previous !== "number") return null;
  if (!Number.isFinite(current) || !Number.isFinite(previous) || previous === 0) return null;
  return (current - previous) / Math.abs(previous);
}

export function formatClock(value: string | null | undefined) {
  if (!value) return "";
  return value.replace(/\s*[-+][0-9]{2}:[0-9]{2}$/, "").replace(/^0/, "").trim();
}

export function formatPercent(
  value: number | null | undefined,
  { alreadyPercent = false, digits = 2 }: { alreadyPercent?: boolean; digits?: number } = {},
) {
  if (value == null || Number.isNaN(value)) return "—";
  const pct = alreadyPercent ? value : value * 100;
  const formatted = pct.toLocaleString("en-US", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
  return `${pct > 0 ? "+" : ""}${formatted}%`;
}

export function formatPercentPlain(
  value: number | null | undefined,
  { alreadyPercent = false, digits = 2 }: { alreadyPercent?: boolean; digits?: number } = {},
) {
  if (value == null || Number.isNaN(value)) return "—";
  const pct = alreadyPercent ? value : value * 100;
  return `${pct.toLocaleString("en-US", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })}%`;
}

export function formatNumber(value: number | null | undefined, digits = 2) {
  if (value == null || Number.isNaN(value)) return "—";
  return value.toLocaleString("en-US", {
    minimumFractionDigits: Number.isInteger(value) ? 0 : Math.min(digits, 2),
    maximumFractionDigits: digits,
  });
}

export function formatInteger(value: number | null | undefined) {
  if (value == null || Number.isNaN(value)) return "—";
  return integerFormatter.format(value);
}

export function formatRatio(value: number | null | undefined, digits = 2) {
  if (value == null || Number.isNaN(value)) return "—";
  return numberFormatter.format(Number(value.toFixed(digits)));
}

export function formatVolume(value: number | null | undefined) {
  return formatInteger(value);
}

export function formatDate(value: string | null | undefined) {
  if (!value) return "—";
  const date = new Date(value.includes("T") ? value : `${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatShortDate(value: string | null | undefined) {
  if (!value) return "—";
  const date = new Date(value.includes("T") ? value : `${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function formatRelativeTime(value: string | null | undefined) {
  if (!value) return "";
  const date = new Date(value.replace(" ", "T") + (value.includes("Z") ? "" : "Z"));
  if (Number.isNaN(date.getTime())) return value;
  const diff = Date.now() - date.getTime();
  const minutes = Math.round(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.round(hours / 24);
  if (days < 14) return `${days}d`;
  return formatDate(value);
}

export function isPositive(value: number | null | undefined) {
  return (value ?? 0) > 0;
}

export function changeClass(value: number | null | undefined) {
  if (value == null || value === 0) return "text-foreground";
  return value > 0 ? "text-gain" : "text-loss";
}

export function signedChange(change: number | null | undefined, percent: number | null | undefined) {
  if (change == null && percent == null) return "—";
  const changeText = change == null ? "" : `${change > 0 ? "+" : ""}${formatPrice(change)}`;
  const pctText = percent == null ? "" : formatPercent(percent, { alreadyPercent: true });
  if (changeText && pctText) return `${changeText} (${pctText})`;
  return changeText || pctText;
}

export function rangeLabel(range: string | null | undefined) {
  if (!range) return "—";
  const [low, high] = range.split("-").map((part) => Number(part));
  if (Number.isNaN(low) || Number.isNaN(high)) return range;
  return `${formatPrice(low)} - ${formatPrice(high)}`;
}
