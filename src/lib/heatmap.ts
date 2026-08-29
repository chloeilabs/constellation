export function heatStyle(percent: number | null | undefined) {
  if (percent == null || Number.isNaN(percent)) {
    return { background: "#e5e7eb", color: "#111827" };
  }
  if (Math.abs(percent) < 0.04) {
    return { background: "#f1f5f9", color: "#0f172a" };
  }
  const t = Math.max(-1, Math.min(1, percent / 3.5));
  if (t >= 0) {
    return {
      background: `hsl(142 72% ${52 - t * 28}%)`,
      color: t > 0.38 ? "#ffffff" : "#052e16",
    };
  }
  return {
    background: `hsl(0 75% ${52 + t * 28}%)`,
    color: t < -0.38 ? "#ffffff" : "#450a0a",
  };
}
